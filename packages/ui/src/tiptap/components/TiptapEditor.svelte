<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
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

  type Props = {
    style?: SystemStyleObject;
    editor?: Editor;
    frozen?: boolean;
    doc?: Y.Doc;
    awareness?: YAwareness.Awareness;
    oninitialize?: () => void;
    onfile?: (event: { pos: number; files: File[] }) => void;
    handleImageUpload: (file: File) => Promise<Record<string, unknown>>;
    handleFileUpload: (file: File) => Promise<Record<string, unknown>>;
    handleEmbed: (url: string) => Promise<Record<string, unknown>>;
    handleLink: (url: string) => Promise<Record<string, unknown>>;
  };

  let {
    style,
    editor = $bindable(),
    frozen = false,
    doc,
    awareness,
    oninitialize,
    onfile,
    handleImageUpload,
    handleFileUpload,
    handleEmbed,
    handleLink,
  }: Props = $props();

  let element = $state<HTMLDivElement>();

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
            onfile?.({
              pos: view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.to,
              files: [...event.dataTransfer.files],
            });

            return true;
          }
        },
        handlePaste: (view, event) => {
          if (event.clipboardData?.files?.length) {
            onfile?.({
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

    oninitialize?.();

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
  spellcheck="false"
></div>
