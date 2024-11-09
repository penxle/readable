import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Code } from '@tiptap/extension-code';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListItem } from '@tiptap/extension-list-item';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Text } from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { MarkdownSerializer } from '@tiptap/pm/markdown';
import { Callout } from './node-views/callout/server';
import { CodeBlock } from './node-views/code-block/server';
import { Embed } from './node-views/embed/server';
import { File } from './node-views/file/server';
import { Hint } from './node-views/hint/server';
import { Image } from './node-views/image/server';
import { InlineImage } from './node-views/inline-image/server';
import { Tab, Tabs } from './node-views/tabs/server';

export const markdownSerializer = new MarkdownSerializer(
  {
    [Blockquote.name]: (state, node) => {
      state.wrapBlock('> ', null, node, () => state.renderContent(node));
    },
    [BulletList.name]: (state, node) => {
      state.renderList(node, '  ', () => '* ');
    },
    [Callout.name]: (state, node) => {
      state.wrapBlock('> ', null, node, () => state.renderContent(node));
    },
    [CodeBlock.name]: () => {
      return;
    },
    [Embed.name]: () => {
      return;
    },
    [File.name]: () => {
      return;
    },
    [HardBreak.name]: (state) => {
      state.write(String.raw`\n`);
    },
    [Heading.name]: (state, node) => {
      state.write(`${'#'.repeat(node.attrs.level)} `);
      state.renderInline(node);
      state.closeBlock(node);
    },
    [HorizontalRule.name]: (state, node) => {
      state.write('---');
      state.closeBlock(node);
    },
    [Hint.name]: (state, node) => {
      state.wrapBlock('> ', null, node, () => state.renderContent(node));
    },
    [ListItem.name]: (state, node) => {
      state.renderContent(node);
    },
    [Image.name]: () => {
      return;
    },
    [InlineImage.name]: () => {
      return;
    },
    [Paragraph.name]: (state, node) => {
      state.renderInline(node);
      state.closeBlock(node);
    },
    [OrderedList.name]: (state, node) => {
      state.renderList(node, '  ', (i) => `${i + 1}. `);
    },
    [Tab.name]: (state, node) => {
      state.wrapBlock('>> ', '> ', node, () => {
        state.write(node.attrs.title);
        state.ensureNewLine();
        state.renderContent(node);
        state.closeBlock(node);
      });
    },
    [Tabs.name]: (state, node) => {
      state.renderContent(node);
    },
    [Table.name]: (state, node) => {
      state.wrapBlock('| ', null, node, () => state.renderContent(node));
    },
    [TableRow.name]: (state, node) => {
      state.renderContent(node);
      state.closeBlock(node);
    },
    [TableCell.name]: (state, node) => {
      state.write(`${node.textContent} | `);
    },
    [TableHeader.name]: (state, node) => {
      state.write(`${node.textContent} | `);
    },
    [Text.name]: (state, node) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.text(node.text!, true);
    },
  },
  {
    [Bold.name]: {
      open: '**',
      close: '**',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    [Code.name]: {
      open: '`',
      close: '`',
    },
    [Italic.name]: {
      open: '*',
      close: '*',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    [Link.name]: {
      open: '',
      close: '',
      mixable: true,
    },
    [TextStyle.name]: {
      open: '',
      close: '',
      mixable: true,
    },
    [Strike.name]: {
      open: '~~',
      close: '~~',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    [Underline.name]: {
      open: '__',
      close: '__',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  },
  {
    hardBreakNodeName: HardBreak.name,
  },
);
