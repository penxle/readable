import { markdownSerializer, schema } from '@readable/ui/tiptap/server';
import { Node } from '@tiptap/pm/model';
import dayjs from 'dayjs';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import * as R from 'remeda';
import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import * as Y from 'yjs';
import {
  db,
  first,
  firstOrThrow,
  PageContentChunks,
  PageContentContributors,
  PageContents,
  PageContentSnapshots,
  PageContentStates,
  PageContentUpdates,
  Pages,
} from '@/db';
import { PageState } from '@/enums';
import * as langchain from '@/external/langchain';
import { pubsub } from '@/pubsub';
import { searchIndex } from '@/search';
import { hashPageContent } from '@/utils/page';
import { enqueueJob } from './index';
import { defineJob } from './types';

export const PageContentStateUpdateJob = defineJob('page:content:state-update', async (pageId: string) => {
  const updated = await db.transaction(async (tx) => {
    const state = await tx
      .select({
        update: PageContentStates.update,
        vector: PageContentStates.vector,
        seq: PageContentStates.seq,
      })
      .from(PageContentStates)
      .where(eq(PageContentStates.pageId, pageId))
      .for('update')
      .then(firstOrThrow);

    const updates = await tx
      .select({ userId: PageContentUpdates.userId, update: PageContentUpdates.update, seq: PageContentUpdates.seq })
      .from(PageContentUpdates)
      .where(and(eq(PageContentUpdates.pageId, pageId), gt(PageContentUpdates.seq, state.seq)))
      .orderBy(desc(PageContentUpdates.seq));

    if (updates.length === 0) {
      return false;
    }

    const update = Y.mergeUpdatesV2(updates.map(({ update }) => update));
    const doc = new Y.Doc();

    Y.applyUpdateV2(doc, state.update);
    const prevSnapshot = Y.snapshot(doc);

    Y.applyUpdateV2(doc, update);
    const snapshot = Y.snapshot(doc);

    await tx
      .update(PageContentStates)
      .set({
        update: Y.encodeStateAsUpdateV2(doc),
        vector: Y.encodeStateVector(doc),
        seq: updates[0].seq,
      })
      .where(and(eq(PageContentStates.pageId, pageId)));

    if (Y.equalSnapshots(prevSnapshot, snapshot)) {
      return false;
    }

    await tx.insert(PageContentSnapshots).values({
      pageId,
      snapshot: Y.encodeSnapshotV2(snapshot),
    });

    const title = doc.getText('title').toString() || null;
    const subtitle = doc.getText('subtitle').toString() || null;
    const fragment = doc.getXmlFragment('content');

    const node = yXmlFragmentToProseMirrorRootNode(fragment, schema);
    const content = node.toJSON();
    const text = node.textBetween(0, node.content.size, '\n');

    await tx
      .update(PageContentStates)
      .set({
        title,
        subtitle,
        content,
        text,
        hash: hashPageContent({ title, subtitle, content }),
        updatedAt: dayjs(),
      })
      .where(and(eq(PageContentStates.pageId, pageId)));

    const uniqueContributorUserIds = R.unique(updates.map((update) => update.userId));
    await tx
      .insert(PageContentContributors)
      .values(uniqueContributorUserIds.map((userId) => ({ pageId, userId })))
      .onConflictDoUpdate({
        target: [PageContentContributors.pageId, PageContentContributors.userId],
        set: { updatedAt: sql`now()` },
      });

    await enqueueJob(tx, 'page:search:index-update', pageId);

    return true;
  });

  if (updated) {
    const page = await db.select({ siteId: Pages.siteId }).from(Pages).where(eq(Pages.id, pageId)).then(firstOrThrow);
    pubsub.publish('site:update', page.siteId, { scope: 'page', pageId });
  }
});

export const PageSearchIndexUpdateJob = defineJob('page:search:index-update', async (pageId: string) => {
  const index = searchIndex('pages');

  const { state } = await db.select({ state: Pages.state }).from(Pages).where(eq(Pages.id, pageId)).then(firstOrThrow);

  if (state === PageState.PUBLISHED) {
    const page = await db
      .select({
        id: Pages.id,
        siteId: Pages.siteId,
        state: Pages.state,
        title: PageContents.title,
        subtitle: PageContents.subtitle,
        text: PageContents.text,
      })
      .from(Pages)
      .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
      .where(eq(Pages.id, pageId))
      .then(firstOrThrow);

    await index.addDocuments([page]);
  } else if (state === PageState.DRAFT) {
    const page = await db
      .select({
        id: Pages.id,
        siteId: Pages.siteId,
        state: Pages.state,
        title: PageContentStates.title,
        subtitle: PageContentStates.subtitle,
        text: PageContentStates.text,
      })
      .from(Pages)
      .innerJoin(PageContentStates, eq(Pages.id, PageContentStates.pageId))
      .where(eq(Pages.id, pageId))
      .then(firstOrThrow);

    await index.addDocuments([page]);
  } else if (state === PageState.DELETED) {
    await index.deleteDocument(pageId);
  }
});

export const PageSummarizeJob = defineJob('page:summarize', async (pageId: string) => {
  const page = await db
    .select({
      title: PageContents.title,
      content: PageContents.content,
    })
    .from(Pages)
    .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
    .where(and(eq(Pages.id, pageId), eq(Pages.state, PageState.PUBLISHED)))
    .then(first);

  if (!page) {
    return;
  }

  const node = Node.fromJSON(schema, page.content);
  const markdown = markdownSerializer.serialize(node, { tightLists: true });

  const chunks = await langchain.textSplitter.splitText(markdown);
  const vectors = await langchain.embeddings.embedDocuments(chunks);

  await db.transaction(async (tx) => {
    await tx.delete(PageContentChunks).where(eq(PageContentChunks.pageId, pageId));

    for (const [index, text] of chunks.entries()) {
      await tx.insert(PageContentChunks).values({
        pageId,
        text,
        vector: vectors[index],
      });
    }
  });
});
