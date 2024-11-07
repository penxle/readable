import { generateHTML } from '@tiptap/html';
import { handleHTML, parseHTML } from 'zeed-dom';
import type { Extensions, JSONContent } from '@tiptap/core';

export const renderHTML = (content: JSONContent, extensions: Extensions) => {
  const html = generateHTML(content, extensions);

  let head = '';

  const body = handleHTML(html, (document) => {
    const nodeViewWrappers = document.querySelectorAll('node-view');

    for (const nodeViewWrapper of nodeViewWrappers) {
      const nodeViewHead = nodeViewWrapper.dataset.head;
      if (nodeViewHead) {
        head += nodeViewHead;
      }

      const nodeViewContent = parseHTML(nodeViewWrapper.dataset.html ?? '');
      const nodeView = nodeViewContent.querySelector('[data-node-view]');

      if (!nodeView) {
        continue;
      }

      const nodeViewContentEditableWrapper = nodeViewWrapper.querySelector('node-view-content-editable');
      const nodeViewContentEditable = nodeView.querySelector('[data-node-view-content-editable]');

      if (nodeViewContentEditableWrapper && nodeViewContentEditable) {
        nodeViewContentEditable.replaceChildren(...nodeViewContentEditableWrapper.children);
      }

      nodeViewWrapper.replaceWith(nodeView);
    }
  });

  return { head, body };
};
