<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { fade, fly } from 'svelte/transition';
  import { scrollLock } from '../actions';
  import Dialog from './dialog/Dialog.svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    onclose?: () => void;
    style?: SystemStyleObject;
    children: Snippet;
  };

  let { open = $bindable(false), onclose, style, children }: Props = $props();
</script>

<Dialog {onclose} {open}>
  <div
    class={css({ position: 'absolute', inset: '0', backgroundColor: 'gray.1000/24' })}
    onclick={() => {
      open = false;
      onclose?.();
    }}
    onkeypress={null}
    role="button"
    tabindex="-1"
    transition:fade={{ duration: 150 }}
  ></div>

  <div
    class={css({
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      width: '[fit-content]',
      margin: 'auto',
      pointerEvents: 'none',
    })}
  >
    <div
      class={css({
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: '1',
        borderWidth: '1px',
        borderColor: 'border.primary',
        borderRadius: '[20px]',
        backgroundColor: 'background.overlay',
        pointerEvents: 'auto',
        size: '[fit-content]',
        maxWidth: '946px',
        maxHeight: '738px',
        boxShadow: 'strong',
        overflow: 'hidden',
      })}
      use:scrollLock
      in:fly={{ y: 10 }}
      out:fade={{ duration: 150 }}
    >
      <div class={css({ height: 'full', overflowY: 'auto' }, style)} data-scroll-lock-ignore>
        <section class={css({ display: 'contents' })}>
          {@render children()}
        </section>
      </div>
    </div>
  </div>
</Dialog>
