import { Node } from '@tiptap/core';
import { createServerNodeView } from '../../lib/server';

export const Tabs = createServerNodeView({
  name: 'tabs',
  group: 'block',
  content: 'tab+',
});

export const Tab = Node.create({
  name: 'tab',
  content: '(paragraph|orderedList|bulletList|image|file|embed|codeBlock)+',
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: '새 탭',
        rendered: false,
      },
    };
  },

  renderText({ node }) {
    return `${node.attrs.title}\n${node.textContent}`;
  },
});
