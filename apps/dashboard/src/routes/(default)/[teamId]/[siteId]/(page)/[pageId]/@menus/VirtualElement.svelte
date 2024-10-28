<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { portal } from '@readable/ui/actions';
  import { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
  import { sineIn } from 'svelte/easing';
  import { fade } from 'svelte/transition';

  export let editor: Editor;
  export let pos: number;
  export let transition = false;
  export let menuContainerEl: HTMLElement;

  let nodeId: string;

  let top: number;
  let left: number;
  let width: number;
  let height: number;

  const update = () => {
    const n = editor.state.doc.nodeAt(pos);
    if (!n) {
      return;
    }

    nodeId = n.attrs.nodeId;

    const { node, offset } = editor.view.domAtPos(pos);
    if (!(node instanceof Element)) {
      return;
    }

    const element = node.children[offset] as HTMLElement;
    if (!element) {
      return;
    }

    top = element.offsetTop;
    left = element.offsetLeft;
    width = element.offsetWidth;
    height = element.offsetHeight;
  };

  $: {
    pos;
    update();
  }

  onMount(() => {
    update();

    editor.on('transaction', update);

    return () => {
      editor.off('transaction', update);
    };
  });
</script>

<svelte:window on:resize={update} on:scroll|capture={update} />

{#key nodeId}
  <div
    style:top={`${top}px`}
    style:left={`${left}px`}
    style:width={`${width}px`}
    style:height={`${height}px`}
    class={flex({ gap: '8px', position: 'absolute', pointerEvents: 'none' })}
    use:portal={menuContainerEl}
    transition:fade|global={{ duration: transition ? 150 : 0, easing: sineIn }}
  >
    <div class={flex({ flex: '1', justify: 'flex-end', align: 'center', height: '[1lh]' })}>
      <slot name="left" />
    </div>
    <div class={css({ width: '720px' })} />
    <div class={flex({ flex: '1', justify: 'flex-start', align: 'center', height: '[1lh]' })}>
      <slot name="right" />
    </div>
  </div>
{/key}
