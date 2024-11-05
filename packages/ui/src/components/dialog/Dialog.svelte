<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { portal } from '../../actions';
  import { openedDialogs } from './state.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    children?: Snippet;
    onclose?: () => void;
  };

  let { open = false, children, onclose }: Props = $props();

  let dialogElement = $state<HTMLDialogElement>();

  $effect(() => {
    if (dialogElement) {
      if (open) {
        const el = dialogElement;
        dialogElement.showModal();
        openedDialogs.push(el);
      } else {
        dialogElement.close();
        openedDialogs.splice(openedDialogs.indexOf(dialogElement), 1);
      }
    }
  });
</script>

<dialog
  bind:this={dialogElement}
  class={css({
    width: 'full',
    height: 'full',
    maxWidth: '[unset]',
    maxHeight: '[unset]',
    '& ::backdrop': {
      display: 'none',
    },
  })}
  onclose={() => onclose?.()}
  use:portal
>
  <!-- NOTE: dialog 닫혀있을 때는 scrollLock 등 사이드 이펙트 안 일어나게 아예 렌더링 안 함 -->
  {#if open}
    {@render children?.()}
  {/if}
</dialog>
