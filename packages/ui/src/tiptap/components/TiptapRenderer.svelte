<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
  import { TableOfContents } from '../extensions/table-of-contents';
  import { renderHTML } from '../lib/html';
  import { Embed } from '../node-views/embed';
  import { File } from '../node-views/file';
  import { Image } from '../node-views/image';
  import { InlineImage } from '../node-views/inline-image';
  import { basicExtensions } from '../schema';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { JSONContent } from '@tiptap/core';

  type Props = {
    style?: SystemStyleObject;
    content: JSONContent;
    editor?: Editor;
    ontocupdate?: (headings: { level: number; text: string; scrollTop: number }[]) => void;
  };

  let { style, content, editor = $bindable(), ontocupdate }: Props = $props();

  let element = $state<HTMLElement>();
  let loaded = $state(false);

  const html = $derived(renderHTML(content, [...basicExtensions, Embed, Image, InlineImage, File]));

  onMount(() => {
    editor = new Editor({
      element,
      editable: false,
      content,
      extensions: [
        ...basicExtensions,
        Embed,
        Image,
        InlineImage,
        File,
        TableOfContents.configure({
          onUpdate: (headings) => {
            ontocupdate?.(headings);
          },
        }),
      ],
      injectCSS: false,

      editorProps: {
        attributes: { class: css(style) },
      },

      onBeforeCreate: () => {
        loaded = true;
      },
    });

    return () => {
      editor?.destroy();
      editor = undefined;
    };
  });
</script>

<article
  bind:this={element}
  class={css({
    display: 'contents',
    fontFamily: 'prose',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'break-all',
  })}
>
  {#if !loaded}
    <div class={cx('ProseMirror', css(style))}>
      {@html html}
    </div>
  {/if}
</article>
