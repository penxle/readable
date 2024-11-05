<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';
  import { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
  import { sineIn } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  type Props = {
    editor: Editor;
    pos: number;
    transition?: boolean;
    port?: Snippet;
    starboard?: Snippet;
  };

  let { editor, pos, transition = false, port, starboard }: Props = $props();

  let nodeId = $state<string>();
  let attrs = $state<{
    top: number;
    left: number;
    width: number;
    height: number;
    lineHeight: number;
  }>();

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

    attrs = {
      top: element.offsetTop,
      left: element.offsetLeft,
      width: element.offsetWidth,
      height: element.offsetHeight,
      lineHeight:
        Number.parseFloat(element.computedStyleMap().get('line-height')?.toString() ?? '1.6') *
        Number.parseFloat(element.computedStyleMap().get('font-size')?.toString() ?? '16'),
    };
  };

  $effect(() => {
    pos;
    update();
  });

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
  {#if attrs}
    <div
      style:top={`${attrs.top}px`}
      style:left={`${attrs.left}px`}
      style:width={`${attrs.width}px`}
      style:height={`${attrs.height}px`}
      style:line-height={`${attrs.lineHeight}px`}
      class={flex({ gap: '8px', position: 'absolute', pointerEvents: 'none' })}
      transition:fade|global={{ duration: transition ? 150 : 0, easing: sineIn }}
    >
      <div class={flex({ flex: '1', justify: 'flex-end', align: 'center', height: '[1lh]' })}>
        {@render port?.()}
      </div>
      <div style:width={`${attrs.width - 80}px`}></div>
      <div class={flex({ flex: '1', justify: 'flex-start', align: 'center', height: '[1lh]' })}>
        {@render starboard?.()}
      </div>
    </div>
  {/if}
{/key}
