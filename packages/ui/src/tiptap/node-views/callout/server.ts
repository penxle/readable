import { createServerNodeView } from '../../lib/server';

export const Callout = createServerNodeView({
  name: 'callout',
  group: 'block',
  content: '(paragraph|orderedList|bulletList|image|file|embed)+',
  defining: true,

  addAttributes() {
    return {
      emoji: { default: 'lightbulb' },
    };
  },
});
