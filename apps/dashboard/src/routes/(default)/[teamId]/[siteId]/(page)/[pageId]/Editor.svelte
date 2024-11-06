<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { TiptapEditor } from '@readable/ui/tiptap';
  import dayjs from 'dayjs';
  import ky from 'ky';
  import { base64 } from 'rfc4648';
  import { onMount } from 'svelte';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import * as YAwareness from 'y-protocols/awareness';
  import * as Y from 'yjs';
  import { PageContentSyncKind } from '@/enums';
  import { page } from '$app/stores';
  import { fragment, graphql } from '$graphql';
  import MenuHandler from './@menus/Handler.svelte';
  import Breadcrumb from './Breadcrumb.svelte';
  import type { Editor } from '@tiptap/core';
  import type { Writable } from 'svelte/store';
  import type { PagePage_Editor_query } from '$graphql';

  type Props = {
    $query: PagePage_Editor_query;
    onconnectionstatechange?: (value: { state: 'connected' | 'disconnected' }) => void;
  };

  let { $query: _query, onconnectionstatechange }: Props = $props();

  const syncPageContent = graphql(`
    mutation PagePage_SyncPageContent_Mutation($input: SyncPageContentInput!) {
      syncPageContent(input: $input) {
        kind
        data
      }
    }
  `);

  const pageContentSyncStream = graphql(`
    subscription PagePage_PageContentSyncStream_Subscription($pageId: ID!) {
      pageContentSyncStream(pageId: $pageId) {
        pageId
        kind
        data
      }
    }
  `);

  const issueBlobUploadUrl = graphql(`
    mutation PagePage_IssueBlobUploadUrl_Mutation($input: IssueBlobUploadUrlInput!) {
      issueBlobUploadUrl(input: $input) {
        path
        url
        fields
      }
    }
  `);

  const persistBlobAsFile = graphql(`
    mutation PagePage_PersistBlobAsFile_Mutation($input: PersistBlobAsFileInput!) {
      persistBlobAsFile(input: $input) {
        id
        name
        size
        url
      }
    }
  `);

  const persistBlobAsImage = graphql(`
    mutation PagePage_PersistBlobAsImage_Mutation($input: PersistBlobAsImageInput!) {
      persistBlobAsImage(input: $input) {
        id
        url
        ratio
        placeholder
      }
    }
  `);

  const unfurlEmbed = graphql(`
    mutation PagePage_UnfurlEmbed_Mutation($input: UnfurlEmbedInput!) {
      unfurlEmbed(input: $input) {
        id
        url
        title
        description
        thumbnailUrl
        html
      }
    }
  `);

  const unfurlLink = graphql(`
    mutation PagePage_UnfurlLink_Mutation($input: UnfurlLinkInput!) {
      unfurlLink(input: $input) {
        __typename

        ... on Page {
          id
          title
        }

        ... on UnfurlLinkUrl {
          url
        }
      }
    }
  `);

  const pageContentCommentUpdateStream = graphql(`
    subscription PagePage_PageContentCommentUpdateStream_Subscription($pageId: ID!) {
      pageContentCommentUpdateStream(pageId: $pageId) {
        id

        comments {
          id
          nodeId
          content
        }
      }
    }
  `);

  let editor = $state<Editor>();
  let titleEl = $state<HTMLElement>();

  const createStore = (name: 'title' | 'subtitle'): Writable<string> => {
    const text = doc.getText(name);

    return {
      subscribe: (set) => {
        const handler = () => {
          set(text.toString());
        };

        text.observe(handler);
        handler();

        return () => {
          text.unobserve(handler);
        };
      },
      set: (value) => {
        doc.transact(() => {
          text.delete(0, text.length);
          text.insert(0, value);
        });
      },
      update: (fn) => {
        doc.transact(() => {
          text.delete(0, text.length);
          text.insert(0, fn(text.toString()));
        });
      },
    };
  };

  const adjustTextareaHeight = (el: HTMLElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const uploadBlob = async (file: File) => {
    const { path, url, fields } = await issueBlobUploadUrl({ filename: file.name });

    const formData = new FormData();
    for (const [key, value] of Object.entries<string>(fields)) {
      formData.append(key, value);
    }

    formData.append('Content-Type', file.type);
    formData.append('file', file);

    await ky.post(url, { body: formData });

    return path;
  };

  const handleFiles = async (pos: number, files: File[]) => {
    for (const file of files) {
      const path = await uploadBlob(file);

      if (file.type.startsWith('image/')) {
        const image = await persistBlobAsImage({ path });
        editor?.commands.insertContentAt(pos, { type: 'image', attrs: image });
      } else {
        const file = await persistBlobAsFile({ path });
        editor?.commands.insertContentAt(pos, { type: 'file', attrs: file });
      }
    }
  };

  const doc = new Y.Doc();
  const awareness = new YAwareness.Awareness(doc);

  doc.on('updateV2', async (update, origin) => {
    if (origin === 'remote') {
      return;
    }

    await syncPageContent({
      pageId: $query.page.id,
      kind: PageContentSyncKind.UPDATE,
      data: base64.stringify(update),
    });
  });

  awareness.on('update', async (states: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    if (origin === 'remote' || !$query) {
      return;
    }

    const update = YAwareness.encodeAwarenessUpdate(awareness, [...states.added, ...states.updated, ...states.removed]);

    await syncPageContent({
      pageId: $query.page.id,
      kind: PageContentSyncKind.AWARENESS,
      data: base64.stringify(update),
    });
  });

  let lastHeartbeatAt = dayjs();
  let connectionState: 'idle' | 'connected' | 'disconnected' = 'idle';

  pageContentSyncStream.on('data', ({ pageContentSyncStream: { pageId, kind, data } }) => {
    if (pageId !== $query.page.id) {
      return;
    }

    if (kind === PageContentSyncKind.UPDATE) {
      Y.applyUpdateV2(doc, base64.parse(data), 'remote');
    } else if (kind === PageContentSyncKind.AWARENESS) {
      YAwareness.applyAwarenessUpdate(awareness, base64.parse(data), 'remote');
    } else if (kind === PageContentSyncKind.HEARTBEAT) {
      lastHeartbeatAt = dayjs();
    }
  });

  const forceSync = async () => {
    if (!$query) {
      return;
    }

    const clientStateVector = Y.encodeStateVector(doc);

    const results = await syncPageContent({
      pageId: $query.page.id,
      kind: PageContentSyncKind.VECTOR,
      data: base64.stringify(clientStateVector),
    });

    for (const { kind, data } of results) {
      if (kind === PageContentSyncKind.VECTOR) {
        const serverStateVector = base64.parse(data);
        const serverMissingUpdate = Y.encodeStateAsUpdateV2(doc, serverStateVector);

        await syncPageContent({
          pageId: $query.page.id,
          kind: PageContentSyncKind.UPDATE,
          data: base64.stringify(serverMissingUpdate),
        });
      } else if (kind === PageContentSyncKind.UPDATE) {
        const clientMissingUpdate = base64.parse(data);
        Y.applyUpdateV2(doc, clientMissingUpdate, 'remote');
      }
    }
  };

  const updateConnectionState = async () => {
    const connected = dayjs().diff(lastHeartbeatAt, 'second') <= 5;

    if (connectionState !== 'connected' && connected) {
      await forceSync();
      connectionState = 'connected';
      onconnectionstatechange?.({ state: 'connected' });
    } else if (connectionState !== 'disconnected' && !connected) {
      connectionState = 'disconnected';
      onconnectionstatechange?.({ state: 'disconnected' });
    }
  };

  const title = createStore('title');

  onMount(() => {
    const persistence = new IndexeddbPersistence(`readable:editor:${$query.page.id}`, doc);
    persistence.on('synced', () => forceSync());

    const unsubscribe = pageContentSyncStream.subscribe({ pageId: $query.page.id });
    const unsubscribeComment = pageContentCommentUpdateStream.subscribe({ pageId: $query.page.id });

    Y.applyUpdateV2(doc, base64.parse($query.page.content.update), 'remote');
    awareness.setLocalStateField('user', {
      name: $query.me.name,
      color: '#000000',
    });

    const heartbeatInterval = setInterval(() => updateConnectionState(), 1000);
    const forceSyncInterval = setInterval(() => forceSync(), 10_000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(forceSyncInterval);

      unsubscribe();
      unsubscribeComment();

      YAwareness.removeAwarenessStates(awareness, [doc.clientID], 'local');

      persistence.destroy();
      awareness.destroy();
      doc.destroy();
    };
  });

  const query = fragment(
    _query,
    graphql(`
      fragment PagePage_Editor_query on Query {
        me @required {
          id
          name
        }

        page(pageId: $pageId) {
          id

          site {
            id

            team {
              id
            }
          }

          content {
            id
            update
          }

          comments {
            id
            nodeId
            content
          }
        }

        ...PagePage_Breadcrumb_query
        ...Editor_MenuHandler_query
      }
    `),
  );

  $effect(() => {
    $title;
    if (titleEl) adjustTextareaHeight(titleEl);
  });
</script>

<div class={css({ flex: '1', overflowY: 'auto' })}>
  <div class={flex({ height: 'full', flexDirection: 'column' })}>
    <div class={css({ paddingTop: '46px' })}>
      <Breadcrumb style={css.raw({ marginX: 'auto', width: '720px' })} {$query} />
    </div>

    <div
      class={flex({
        flexDirection: 'column',
        gap: '8px',
        marginX: 'auto',
        marginTop: '34px',
        marginBottom: '32px',
        width: '720px',
        color: 'text.primary',
      })}
    >
      <textarea
        bind:this={titleEl}
        class={css({
          textStyle: '34b',
          lineHeight: '[1.3]',
          height: 'auto',
          wordBreak: 'break-all',
          overflowY: 'hidden',
          resize: 'none',
        })}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        placeholder="제목을 입력하세요"
        rows="1"
        bind:value={$title}
      ></textarea>
    </div>

    <!-- {#if editor}
      {JSON.stringify(editor.state.selection.toJSON())}
      {JSON.stringify(editor.state.doc.resolve(editor.state.selection.$from.start(1)).node().toJSON())}
    {/if} -->

    <div class={css({ position: 'relative', flexGrow: '1' })}>
      <TiptapEditor
        style={css.raw({
          color: 'text.primary',
          paddingBottom: '128px',

          minWidth: '720px',
          width: 'full',

          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',

          '& > *': {
            width: 'full',
            paddingX: '[calc((100% - 720px) / 2)]',
          },
        })}
        {awareness}
        {doc}
        handleEmbed={async (url, noCache = false) => {
          return await unfurlEmbed({ url, noCache });
        }}
        handleFileUpload={async (file) => {
          const path = await uploadBlob(file);
          return await persistBlobAsFile({ path });
        }}
        handleImageUpload={async (file) => {
          const path = await uploadBlob(file);
          return await persistBlobAsImage({ path });
        }}
        handleLink={async (url) => {
          const resp = await unfurlLink({ siteId: $query.page.site.id, url });
          return resp.__typename === 'Page'
            ? {
                name: resp.title,
                href: `page:///${resp.id}`,
                host: $page.url.origin,
                url: `/${$query.page.site.team.id}/${$query.page.site.id}/${resp.id}`,
              }
            : { href: resp.url };
        }}
        onfile={(e) => handleFiles(e.pos, e.files)}
        bind:editor
      />

      <div>
        {#if editor}
          <MenuHandler {$query} {editor} />
        {/if}
      </div>
    </div>
  </div>
</div>
