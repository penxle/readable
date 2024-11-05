<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { setContext, tick } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { createFloatingActions } from '../actions/index';
  import type { OffsetOptions, Placement } from '@floating-ui/dom';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    placement?: Placement;
    offset?: OffsetOptions;
    style?: SystemStyleObject;
    listStyle?: SystemStyleObject;
    setFullWidth?: boolean;
    disableAutoUpdate?: boolean;
    onopen?: () => void;
    button?: Snippet<[{ open: boolean }]>;
    action?: Snippet;
    children?: Snippet<[{ close: () => void }]>;
  };

  let {
    open = $bindable(false),
    placement = 'bottom',
    offset = 6,
    style,
    listStyle,
    setFullWidth = false,
    disableAutoUpdate = false,
    onopen,
    button,
    action,
    children,
  }: Props = $props();

  let buttonEl: HTMLButtonElement | undefined = $state();
  let menuEl: HTMLUListElement | undefined = $state();

  const { anchor, floating } = createFloatingActions({
    placement,
    offset,
    disableAutoUpdate,
    onClickOutside: () => {
      open = false;
    },
  });

  const close = () => {
    open = false;
    buttonEl?.focus();
  };

  setContext('close', close);

  afterNavigate(() => {
    open = false;
  });

  const getMenuItems = () => {
    return menuEl?.querySelectorAll('[role="menuitem"], [role="menuitemradio"]');
  };

  const onKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (open) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'Tab') {
        close();
        return;
      }

      const focusInList = menuEl?.contains(target);

      const menuItems = getMenuItems();
      if (!menuItems || menuItems.length === 0) {
        return;
      }

      // eslint-disable-next-line unicorn/prefer-spread
      const pos = Array.from(menuItems).indexOf(target);

      if (focusInList) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (menuItems[pos + 1] || menuItems[0]) as HTMLElement;
          next?.focus();
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          // eslint-disable-next-line unicorn/prefer-at
          const prev = (menuItems[pos - 1] || menuItems[menuItems.length - 1]) as HTMLElement;
          prev?.focus();
        }
      } else {
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
          e.preventDefault();
          (menuItems[0] as HTMLElement).focus();
        }
      }
    } else {
      // 버튼에 포커스가 있을 때 아래 키로 메뉴를 열고 첫번째 항목에 포커스
      const focusInButton = buttonEl?.contains(target);
      if (focusInButton && e.key === 'ArrowDown') {
        e.preventDefault();
        open = true;
        tick().then(() => {
          const menuItems = getMenuItems();
          if (!menuItems || menuItems.length === 0) {
            return;
          }
          (menuItems[0] as HTMLElement).focus();
        });
      }
    }
  };
</script>

<svelte:window onkeydown={onKeydown} />

<button
  bind:this={buttonEl}
  class={cx(css(style), 'menu-button')}
  aria-expanded={open}
  onclick={(e) => {
    e.preventDefault();
    open = !open;
    if (open) {
      onopen?.();
    }
  }}
  type="button"
  use:anchor
>
  {@render button?.({ open })}
</button>

{#if open}
  <ul
    bind:this={menuEl}
    style:width={setFullWidth ? `${buttonEl?.getBoundingClientRect().width}px` : undefined}
    class={css(
      {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        borderWidth: '1px',
        borderColor: 'border.secondary',
        borderRadius: '12px',
        paddingY: '6px',
        backgroundColor: 'background.overlay',
        minWidth: '120px',
        boxShadow: 'strong',
        overflowY: 'auto',
        zIndex: '50',
      },
      action && { paddingBottom: '0' },
      listStyle,
    )}
    role="menu"
    use:floating
  >
    {#if action}
      <li>
        <ul class={css({ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' })}>
          {@render children?.({ close })}
        </ul>
      </li>
    {:else}
      {@render children?.({ close })}
    {/if}

    {#if action}
      <li class={css({ position: 'sticky', bottom: '0', paddingBottom: '12px', backgroundColor: 'surface.primary' })}>
        {@render action?.()}
      </li>
    {/if}
  </ul>
{/if}
