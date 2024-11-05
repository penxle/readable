<script generics="T extends 'button' | 'link' = 'button'" lang="ts">
  import { createBubbler, handlers } from 'svelte/legacy';

  const bubble = createBubbler();
  import { css, cva, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { getContext } from 'svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

  type $$Props = {
    type?: T;
    style?: SystemStyleObject;
    disabled?: boolean;
    variant?: 'default' | 'danger';
  } & (T extends 'link'
    ? Omit<HTMLAnchorAttributes, 'type' | 'style' | 'disabled'> & { external?: boolean }
    : unknown) &
    (T extends 'button' ? Omit<HTMLButtonAttributes, 'type' | 'style' | 'disabled'> : unknown);

  type $$Events = T extends 'link' ? unknown : { click: MouseEvent };

  type Props = {
    type?: 'button' | 'link';
    style?: SystemStyleObject | undefined;
    variant?: 'default' | 'danger';
    disabled?: boolean;
    href?: string | undefined;
    external?: any;
    prefix?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    [key: string]: any;
  };

  let {
    type = 'button',
    style = undefined,
    variant = 'default',
    disabled = false,
    href = undefined,
    external = !href?.startsWith('/'),
    prefix,
    children,
    ...rest
  }: Props = $props();

  let element: 'a' | 'button' = $derived(type === 'link' ? 'a' : type);

  let props = $derived(
    (type === 'link' && { href: disabled || href, 'data-sveltekit-preload-data': false }) ||
      (type === 'button' && { type: 'button', disabled }) ||
      {},
  );

  let close = getContext<undefined | (() => void)>('close');

  let focused = $state(false);
</script>

<svelte:element
  this={element}
  onblur={() => (focused = false)}
  onclick={handlers(bubble('click'), close)}
  onfocus={() => (focused = true)}
  role="menuitem"
  tabindex={focused ? 0 : -1}
  {...external && {
    target: '_blank',
    rel: 'noopener noreferrer',
  }}
  {...props}
  {...rest}
  {...type === 'link' && {
    // NOTE: link 타입이어도 _enabled 스타일이 적용되도록 함
    'aria-disabled': 'false',
  }}
  class={cx(
    cva({
      base: flex.raw({
        alignItems: 'center',
        gap: '10px', // NOTE: override 하는 workaround: style에 columnGap을 넘기기
        borderRadius: '6px',
        marginX: '6px',
        paddingX: '12px',
        paddingY: '7px',
        textStyle: '14m',
        textAlign: 'left',
        color: 'text.secondary',
        _enabled: {
          _hover: {
            backgroundColor: 'neutral.10',
          },
          _focus: {
            backgroundColor: 'neutral.20',
          },
          _active: {
            color: 'text.primary',
            backgroundColor: 'neutral.10',
          },
          _selected: {
            color: 'text.primary',
            backgroundColor: 'neutral.10',
          },
        },
        _disabled: {
          color: 'text.disabled',
        },
      }),
      variants: {
        variant: {
          default: {
            color: 'text.secondary',
          },
          danger: {
            color: 'text.danger',
          },
        },
      },
    })({ variant }),
    css(style),
  )}
>
  {@render prefix?.()}
  {@render children?.()}
</svelte:element>
