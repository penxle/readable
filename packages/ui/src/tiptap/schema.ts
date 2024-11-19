import { css } from '@readable/styled-system/css';
import { createAnchorId } from '@readable/ui/utils';
import { mergeAttributes } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Code } from '@tiptap/extension-code';
import { Color } from '@tiptap/extension-color';
import { Document } from '@tiptap/extension-document';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { History } from '@tiptap/extension-history';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListItem } from '@tiptap/extension-list-item';
import { ListKeymap } from '@tiptap/extension-list-keymap';
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
import { Behavior } from './extensions/behavior';
import { BlockSelectionHelper } from './extensions/block-selection';
import { withNodeId } from './extensions/node-id';
import { Placeholder } from './extensions/placeholder';
import { extendNodeToNodeView } from './lib/create';
import { BubbleMenu } from './menus/bubble';
import { SlashMenu } from './menus/slash';
import { Callout } from './node-views';
import { CodeBlock } from './node-views/code-block';
import { Hint } from './node-views/hint';
import TableComponent from './node-views/table/Component.svelte';
import { Tab, Tabs } from './node-views/tabs';

const extensions = [
  // special nodes
  Document.extend({
    content: 'block+',
  }),
  Text,

  // nodes
  Paragraph.configure({
    HTMLAttributes: {
      class: css({
        textStyle: '16r',
      }),
    },
  }).extend({
    renderHTML({ node, HTMLAttributes }) {
      return [
        'p',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        !this.editor?.isEditable && node.content.size === 0 ? ['br'] : 0,
      ];
    },
  }),
  Heading.configure({
    levels: [1, 2, 3],
  }).extend({
    parseHTML() {
      return this.options.levels.map((level) => ({
        tag: `h${level + 1}`,
        attrs: { level },
      }));
    },
    renderHTML({ node, HTMLAttributes }) {
      const hasLevel = node.attrs.level;
      const level = hasLevel ? node.attrs.level : 1;
      const id = createAnchorId(node.textContent);
      const textStyle = node.attrs.level === 1 ? '26b' : node.attrs.level === 2 ? '22b' : '18b';

      return [
        `h${level + 1}`,
        mergeAttributes(HTMLAttributes, { id, class: css({ textStyle }) }),
        !this.editor?.isEditable && node.content.size === 0 ? ['br'] : 0,
      ];
    },
  }),
  HardBreak,
  HorizontalRule.configure({
    HTMLAttributes: {
      class: css({
        paddingY: '12px',
        _before: {
          content: '""',
          display: 'block',
          height: '1px',
          backgroundColor: 'neutral.30',
        },
      }),
    },
  }),
  Blockquote.extend({ content: 'paragraph+' }).extend({
    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        {},
        [
          'blockquote',
          mergeAttributes(HTMLAttributes, {
            class: css({
              borderLeftWidth: '3px',
              borderLeftColor: 'neutral.30',
              paddingLeft: '25px',
              color: 'text.primary',
            }),
          }),
          0,
        ],
      ];
    },
  }),
  BulletList.extend({
    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        [
          'ul',
          mergeAttributes(HTMLAttributes, {
            class: css({
              paddingLeft: '15px',
              listStylePosition: 'outside',
              listStyleType: 'disc',
              'ul ul&': { listStyleType: 'circle' },
            }),
          }),
          0,
        ],
      ];
    },
  }),
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

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        [
          'ol',
          mergeAttributes(HTMLAttributes, {
            class: css({
              paddingLeft: '15px',
              listStylePosition: 'outside',
              listStyleType: 'decimal',
              'ol ol&': { listStyleType: 'lower-alpha' },
            }),
          }),
          0,
        ],
      ];
    },
  }),
  ListItem.extend({
    content: 'paragraph (paragraph | bulletList | orderedList)*',

    renderHTML({ HTMLAttributes }) {
      return ['li', mergeAttributes(HTMLAttributes, {}), 0];
    },
  }),
  extendNodeToNodeView(Table, TableComponent).configure({
    resizable: true,
    lastColumnResizable: false,
    cellMinWidth: 50,
    allowTableNodeSelection: true,
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: css({
        '&:last-child :is(td, th)': {
          borderBottom: 'none',
        },
      }),
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: css({
        borderTopWidth: '0',
        border: '1px solid',
        borderColor: 'neutral.30',
        paddingX: '14px',
        paddingY: '10px',
      }),
    },
  }).extend({
    content: 'paragraph+',
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: css({
        borderTopWidth: '0',
        border: '1px solid',
        borderColor: 'neutral.30',
        paddingX: '14px',
        paddingY: '10px',
      }),
    },
  }).extend({
    content: 'paragraph+',
  }),

  // marks
  Bold.configure({ HTMLAttributes: { class: css({ fontWeight: 'bold' }) } }),
  Italic.configure({ HTMLAttributes: { class: css({ fontStyle: 'italic' }) } }),
  Strike.configure({ HTMLAttributes: { class: css({ textDecorationLine: 'line-through' }) } }),
  Underline.configure({
    HTMLAttributes: { class: css({ textDecorationLine: 'underline', textUnderlineOffset: '2px' }) },
  }),
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

    addCommands() {
      return {
        setColor:
          (className) =>
          ({ chain }) => {
            return chain().setMark('textStyle', { color: className }).run();
          },
        unsetColor:
          () =>
          ({ chain }) => {
            return chain().setMark('textStyle', { color: null }).removeEmptyTextStyle().run();
          },
      };
    },
  }),
  Code.configure({
    HTMLAttributes: {
      class: css({
        borderRadius: '4px',
        paddingX: '4px',
        paddingY: '2px',
        textStyle: '14m',
        backgroundColor: 'neutral.30/70',
        fontFamily: 'mono',
      }),
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: css({
        color: 'var(--usersite-theme-color)',
        fontWeight: '[500]',
        textDecorationLine: 'underline',
        textDecorationColor: 'var(--usersite-theme-color)/40',
        textUnderlineOffset: '2px',
        cursor: 'pointer',

        _hover: {
          textDecorationColor: 'var(--usersite-theme-color)/80',
          textDecorationThickness: '2px',
        },
      }),
    },
  }).extend({
    renderHTML({ HTMLAttributes }) {
      let attrs = HTMLAttributes;
      if (attrs.href?.startsWith('page:///')) {
        attrs = {
          target: this.editor?.isEditable ? '_blank' : null,
          rel: null,
          href: attrs.href.replace('page:///', '/_/go/'),
        };
      }

      return ['a', mergeAttributes(this.options.HTMLAttributes, attrs), 0];
    },
  }),

  // extensions
  TextAlign,
  TextStyle,

  // node views
  Callout,
  CodeBlock,
  Hint,

  Tabs,
  Tab,
];

export const basicExtensions = withNodeId(extensions);

export const editorExtensions = [
  Dropcursor.configure({ width: 4, class: css({ color: '[var(--prosemirror-color-selection)/40]' }) }),
  History,
  Placeholder,
  ListKeymap,

  Behavior,
  BlockSelectionHelper,
  BubbleMenu,
  SlashMenu,
];
