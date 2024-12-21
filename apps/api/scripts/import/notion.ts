/* eslint-disable unicorn/no-process-exit */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { createInterface } from 'node:readline/promises';
import emojiData from 'emoji-datasource-twitter/emoji.json';
import { db } from '@/db';
import { $fetch, generatePageId, insertCategory, insertPage, insertSite } from './utils';
import type { ParseRule } from '@tiptap/pm/model';
import type { Transaction } from '@/db';

const rules: ParseRule[] = [
  {
    node: 'image',
    tag: 'div',
    getAttrs: (node) => {
      if (!node.className.includes('notion-image-block')) {
        return false;
      }

      const img = node.querySelector('img');
      if (!img) {
        return false;
      }

      const src = img.getAttribute('src');
      if (!src) {
        return false;
      }

      if (src.startsWith('/image/')) {
        const siteOrigin = new URL(siteUrl).origin;
        return {
          url: `${siteOrigin}${src}`,
        };
      }

      return {
        url: src,
      };
    },
  },
  {
    node: 'callout',
    tag: 'div',
    getAttrs: (node) => {
      if (!node.className.includes('notion-callout-block')) {
        return false;
      }

      const emoji = node.querySelector('.notion-record-icon span')?.textContent?.trim();
      if (!emoji) {
        return {};
      }

      const emojiCodePoint = [...emoji].map((char) => char.codePointAt(0)?.toString(16).toUpperCase()).join('-');

      return {
        emoji: emojiData.find((row) => row.unified === emojiCodePoint)?.short_name,
      };
    },
    contentElement: '> div:first-child > div:first-child > div:last-child > div:first-child',
  },
  {
    node: 'embed',
    tag: 'div',
    getAttrs: (node) => {
      if (node.className.includes('notion-bookmark-block')) {
        const href = node.querySelector('a')?.getAttribute('href');
        if (!href) {
          return false;
        }

        return {
          url: href,
        };
      } else if (node.className.includes('notion-video-block')) {
        const src = node.querySelector('iframe')?.getAttribute('src');

        if (!src) {
          return false;
        }

        return {
          url: src,
        };
      }

      return false;
    },
  },
  {
    mark: 'link',
    tag: 'a',
    getAttrs: (node) => {
      const href = node.getAttribute('href');
      if (!href) {
        return false;
      }

      if (href.startsWith('/')) {
        const id = pathToId(href);
        if (!id) {
          return { href };
        }

        return { href: `page:///${notionIdToPageId(id)}` };
      }

      return { href };
    },
  },
  {
    mark: 'code',
    tag: 'span',
    getAttrs: (node) => {
      if (node.style.fontFamily.includes('monospace')) {
        return {};
      }

      return false;
    },
  },
];

const pageMap: Record<string, string> = {};
const idMap: Record<string, string> = {};

const pathToId = (path: string) => {
  const id = path.split('?').at(0)?.split('-').at(-1);

  if (id?.startsWith('/')) {
    return id.slice(1);
  }

  return id;
};
const notionIdToPageId = (notionId: string) => idMap[notionId] ?? (idMap[notionId] = generatePageId());

type FetchPageOptions = {
  siteId: string;
  origin: string;
  path: string;
  tx: Transaction;
  categoryId?: string;
};

const fetchPage = async ({ siteId, origin, path, tx, categoryId }: FetchPageOptions) => {
  const id = pathToId(path);

  if (!id || pageMap[id]) {
    return;
  }

  pageMap[id] = path;

  const $ = await $fetch(origin, path);
  const element = $('div.layout');
  element.find('.notion-table_of_contents-block').remove();
  const title = element.find('.notion-page-block > h1').text();
  const html = element.find('.notion-page-content').html()!;
  const breadcrumb = $('div.shadow-cursor-breadcrumb > div');
  const categoryName = breadcrumb.length > 1 ? breadcrumb.eq(-2).text() : breadcrumb.text();

  if (!categoryId) {
    const category = await insertCategory({
      tx,
      siteId,
      name: categoryName,
    });
    categoryId = category.id;
  }

  /*const page = */ await insertPage({
    id: notionIdToPageId(id),
    tx,
    siteId,
    categoryId,
    parentId: null,
    title,
    html,
    rules,
  });

  const linkList = element.find('.notion-page-block a').add(element.find('.notion-alias-block a'));

  for (const link of linkList) {
    const node = $(link);
    const href = node.attr('href');
    if (!href) {
      continue;
    }

    await fetchPage({
      siteId,
      origin,
      path: href.split('?')[0].slice(1),
      categoryId,
      tx,
    });
  }
};

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const siteName = (await rl.question('사이트 이름: ')) || '테스트';
const siteSlug = (await rl.question('사이트 slug: ')) || 'import-test';
const siteUrl = new URL(process.argv[2] ?? (await rl.question('사이트 URL: ')));

await db.transaction(async (tx) => {
  const site = await insertSite({
    tx,
    name: siteName,
    slug: siteSlug,
  });

  await fetchPage({
    siteId: site.id,
    origin: siteUrl.origin,
    path: siteUrl.pathname,
    tx,
  });
});

process.exit(0);
