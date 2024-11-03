<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { Editor } from '@tiptap/core';
  import { createEventDispatcher, onMount } from 'svelte';
  import { Collaboration } from '../extensions/collaboration';
  import { Freeze } from '../extensions/freeze';
  import { LinkEditPopover } from '../menus/link-edit-popover';
  import { LinkTooltip } from '../menus/link-tooltip';
  import { Embed } from '../node-views/embed';
  import { File } from '../node-views/file';
  import { Image } from '../node-views/image';
  import { InlineImage } from '../node-views/inline-image';
  import { basicExtensions, editorExtensions } from '../schema';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type * as YAwareness from 'y-protocols/awareness';
  import type * as Y from 'yjs';

  const dispatch = createEventDispatcher<{
    initialize: null;
    file: { pos: number; files: File[] };
  }>();

  export let style: SystemStyleObject | undefined = undefined;

  export let editor: Editor | undefined = undefined;
  export let frozen = false;

  export let doc: Y.Doc | undefined = undefined;
  export let awareness: YAwareness.Awareness | undefined = undefined;

  export let handleImageUpload: (file: File) => Promise<Record<string, unknown>>;
  export let handleFileUpload: (file: File) => Promise<Record<string, unknown>>;
  export let handleEmbed: (url: string) => Promise<Record<string, unknown>>;
  export let handleLink: (url: string) => Promise<Record<string, unknown>>;

  let element: HTMLDivElement;

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        ...basicExtensions,
        ...editorExtensions,
        Embed.configure({ handleEmbed }),
        Image.configure({ handleImageUpload }),
        InlineImage.configure({ handleImageUpload }),
        File.configure({ handleFileUpload }),
        LinkEditPopover.configure({ handleLink }),
        LinkTooltip.configure({ handleLink }),
        Collaboration.configure({ doc, awareness }),
        ...(frozen ? [Freeze] : []),
      ],
      injectCSS: false,
      editorProps: {
        attributes: { class: css(style) },
        scrollMargin: { top: 150, bottom: 50, left: 0, right: 0 },
        scrollThreshold: { top: 150, bottom: 50, left: 0, right: 0 },
        handleDrop: (view, event) => {
          if (event.dataTransfer?.files?.length) {
            dispatch('file', {
              pos: view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.to,
              files: [...event.dataTransfer.files],
            });

            return true;
          }
        },
        handlePaste: (view, event) => {
          if (event.clipboardData?.files?.length) {
            dispatch('file', {
              pos: view.state.selection.to,
              files: [...event.clipboardData.files],
            });

            return true;
          }
        },
      },
      onTransaction: ({ editor: editor_ }) => {
        editor = editor_;
      },
    });

    dispatch('initialize');

    return () => {
      editor?.destroy();
      editor = undefined;
    };
  });
</script>

<div
  bind:this={element}
  class={css({ display: 'contents', fontFamily: 'prose', whiteSpace: 'pre-wrap', wordBreak: 'break-all' })}
  autocapitalize="off"
  autocorrect="off"
  spellcheck="false"
/>
