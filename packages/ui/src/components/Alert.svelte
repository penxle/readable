<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { fade, fly } from 'svelte/transition';
  import { scrollLock } from '../actions';
  import Button from './Button.svelte';
  import Dialog from './dialog/Dialog.svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';

  type Props = {
    open: boolean;
    containerStyle?: SystemStyleObject;
    actionStyle?: SystemStyleObject;
    oncancel?: () => void;
    onaction: () => void;
    variant?: 'primary' | 'danger';
    title?: Snippet;
    content?: Snippet;
    children?: Snippet;
    cancel?: Snippet;
    action?: Snippet;
  };

  let {
    open = $bindable(),
    containerStyle,
    actionStyle,
    oncancel,
    onaction,
    variant = 'danger',
    title,
    content,
    children,
    cancel,
    action,
  }: Props = $props();
</script>

<Dialog onclose={() => (open = false)} {open}>
  <div
    class={css({ position: 'absolute', inset: '0', backgroundColor: 'gray.1000/24' })}
    onclick={() => (open = false)}
    onkeypress={null}
    role="button"
    tabindex="-1"
    transition:fade|global={{ duration: 150 }}
  ></div>

  <div
    class={css({
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingX: '32px',
      width: 'full',
      pointerEvents: 'none',
    })}
  >
    <div
      class={css(
        {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          borderWidth: '1px',
          borderColor: 'border.primary',
          borderRadius: '16px',
          padding: '32px',
          backgroundColor: 'background.overlay',
          pointerEvents: 'auto',
          userSelect: 'text',
          width: 'auto',
          minWidth: '480px',
          maxWidth: '600px',
          boxShadow: 'strong',
        },
        containerStyle,
      )}
      use:scrollLock
      in:fly|global={{ y: 10 }}
      out:fade|global={{ duration: 150 }}
    >
      <header>
        <h3
          class={css({
            textStyle: '20b',
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
          })}
        >
          {@render title?.()}
        </h3>
      </header>

      <div
        class={css({
          marginTop: '6px',
          textStyle: '15r',
          color: 'text.secondary',
        })}
      >
        {@render content?.()}
      </div>

      {@render children?.()}

      <div
        class={css(
          {
            display: 'flex',
            gap: '8px',
            marginTop: '32px',
            justifyContent: 'flex-end',
          },
          actionStyle,
        )}
      >
        <Button
          style={css.raw({ minWidth: '95px' })}
          onclick={() => {
            if (oncancel) oncancel();
            open = false;
          }}
          size="lg"
          variant="secondary"
        >
          {@render cancel?.()}
        </Button>
        <Button
          style={css.raw({ minWidth: '95px' })}
          onclick={() => {
            onaction();
            open = false;
          }}
          size="lg"
          variant={variant === 'primary' ? 'primary' : 'danger-fill'}
        >
          {@render action?.()}
        </Button>
      </div>
    </div>
  </div>
</Dialog>
