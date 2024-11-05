<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { Icon } from '@readable/ui/components';
  import { createAnchorId } from '@readable/ui/utils';
  import { Editor } from '@tiptap/core';
  import { run } from 'svelte/legacy';
  import HashIcon from '~icons/lucide/hash';
  import VirtualElement from './VirtualElement.svelte';
  import type { Node } from 'prosemirror-model';

  type Props = {
    editor: Editor;
  };

  let { editor }: Props = $props();

  let pos: number | null = $state(null);

  const handlePointerMove = (event: PointerEvent) => {
    const { clientX, clientY } = event;
    const posAtCoords = editor.view.posAtCoords({ left: clientX, top: clientY });

    if (posAtCoords) {
      if (posAtCoords.inside === -1) {
        pos = null;
      } else {
        const pos$ = editor.state.doc.resolve(posAtCoords.inside);
        pos = pos$.before(1);
      }
    } else {
      pos = null;
    }
  };

  let node: Node | null = $state(null);
  run(() => {
    if (pos === null) {
      node = null;
    } else {
      node = editor.state.doc.nodeAt(pos);
    }
  });
</script>

<svelte:window onpointermove={handlePointerMove} />

{#if pos !== null && node?.type.name === 'heading'}
  <VirtualElement {editor} {pos}>
    {#snippet left()}
      <a
        class={css({ color: 'neutral.50', pointerEvents: 'auto', smOnly: { display: 'none' } })}
        href={`#${createAnchorId(node.textContent)}`}
      >
        <Icon icon={HashIcon} size={16} />
      </a>
    {/snippet}
  </VirtualElement>
{/if}
