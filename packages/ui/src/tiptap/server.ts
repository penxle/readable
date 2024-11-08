import { getSchema } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Code } from '@tiptap/extension-code';
import { Color } from '@tiptap/extension-color';
import { Document } from '@tiptap/extension-document';
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
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { withNodeId } from './extensions/node-id';
import { Callout } from './node-views/callout/server';
import { CodeBlock } from './node-views/code-block/server';
import { Embed } from './node-views/embed/server';
import { File } from './node-views/file/server';
import { Hint } from './node-views/hint/server';
import { Image } from './node-views/image/server';
import { InlineImage } from './node-views/inline-image/server';
import { Tab, Tabs } from './node-views/tabs/server';

const extensions = [
  // special nodes
  Document.extend({
    content: 'block+',
  }),
  Text,

  // nodes
  Paragraph,
  Heading.extend({
    parseHTML() {
      return this.options.levels.map((level) => ({
        tag: `h${level + 1}`,
        attrs: { level },
      }));
    },
  }),
  HardBreak,
  HorizontalRule,
  Blockquote,
  BulletList,
  OrderedList.extend({
    addAttributes() {
      return {
        start: {
          default: 1,
          parseHTML: (element) => {
            return element.hasAttribute('start') ? Number.parseInt(element.getAttribute('start') || '', 10) : 1;
          },
        },
        type: {
          default: null,
          parseHTML: (element) => element.getAttribute('type'),
        },
      };
    },
  }),
  ListItem.extend({
    content: 'paragraph (paragraph | bulletList | orderedList)*',
  }),
  Table,
  TableRow,
  TableHeader.extend({
    content: 'paragraph+',
  }),
  TableCell.extend({
    content: 'paragraph+',
  }),

  // marks
  Bold,
  Italic,
  Strike,
  Underline,
  Color.extend({
    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            color: {
              parseHTML: (element) => element.dataset.color,
              renderHTML: (attributes) => {
                return { 'data-color': attributes.color };
              },
            },
          },
        },
      ];
    },
  }),
  Code,
  Link.extend({
    addAttributes() {
      return {
        href: {
          default: null,
          parseHTML(element) {
            return element.getAttribute('href');
          },
        },
        target: {
          default: this.options.HTMLAttributes.target,
          parseHTML: () => undefined,
        },
        rel: {
          default: this.options.HTMLAttributes.rel,
          parseHTML: () => undefined,
        },
        class: {
          default: this.options.HTMLAttributes.class,
          parseHTML: () => undefined,
        },
      };
    },
  }),

  // extensions
  TextAlign,
  TextStyle,

  // node views
  Callout,
  CodeBlock,
  Embed,
  File,
  Hint,
  Image,
  InlineImage,
  Tabs,
  Tab,
];

export const serverExtensions = withNodeId(extensions);

export const schema = getSchema(serverExtensions);

export * from './markdown';
