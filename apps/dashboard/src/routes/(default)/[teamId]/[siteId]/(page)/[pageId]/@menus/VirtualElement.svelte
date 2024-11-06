<script lang="ts">
  import { css } from '@readable/styled-system/css';
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
    port?: Snippet<[{ pos: number }]>;
    starboard?: Snippet<[{ pos: number }]>;
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
    if (pos === null) {
      return;
    }

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
    editor.on('transaction', update);

    return () => {
      editor.off('transaction', update);
    };
  });
</script>

<svelte:window onresize={update} onscrollcapture={update} />

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
        {@render port?.({ pos })}
      </div>
      <div class={css({ width: '720px' })}></div>
      <div class={flex({ flex: '1', justify: 'flex-start', align: 'center', height: '[1lh]' })}>
        {@render starboard?.({ pos })}
      </div>
    </div>
  {/if}
{/key}
