<script lang="ts">
  import { css, cx, sva } from '@readable/styled-system/css';
  import CheckIcon from '~icons/lucide/check';
  import { getFormContext } from '../forms';
  import FormValidationMessage from './FormValidationMessage.svelte';
  import Icon from './Icon.svelte';
  import type { RecipeVariantProps, SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  type Props = {
    name?: string;
    checked?: boolean;
    style?: SystemStyleObject;
    children?: Snippet;
  } & RecipeVariantProps<typeof recipe> &
    Omit<HTMLInputAttributes, 'style' | 'variant' | 'size'>;

  let {
    name = $bindable(),
    checked = $bindable(false),
    style,
    variant = 'gray',
    size = 'lg',
    children,
    ...rest
  }: Props = $props();

  const { field } = getFormContext();

  if (field) {
    name = field.name;
  }

  const recipe = sva({
    slots: ['wrapper', 'item', 'text'],
    base: {
      wrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      },
      item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        size: '13px',
        borderWidth: '2px',
        borderColor: 'gray.500',
        borderRadius: '2px',
        cursor: 'pointer',
        appearance: 'none',
        transition: 'common',
        _enabled: { '&[aria-invalid]': { borderColor: 'red.600' } },
      },
      text: { cursor: 'pointer' },
    },
    variants: {
      variant: {
        gray: {
          item: {
            _checked: { borderWidth: '0', backgroundColor: 'gray.900' },
          },
        },
        brand: {
          item: {
            _checked: { borderWidth: '0', backgroundColor: 'brand.600' },
          },
        },
      },
      size: {
        sm: {
          wrapper: { size: '18px' },
          item: { size: '14px', _checked: { size: '15px' } },
          text: { fontSize: '14px' },
        },
        md: {
          wrapper: { size: '20px' },
          item: { size: '15px', _checked: { size: '16px' } },
          text: { fontSize: '15px' },
        },
        lg: {
          wrapper: { size: '22px' },
          item: { size: '15px', _checked: { size: '16px' } },
          text: { fontSize: '15px' },
        },
      },
    },
  });

  const classes = $derived(recipe.raw({ variant, size }));
</script>

<div>
  <label class={css({ display: 'flex', alignItems: 'center', gap: '8px' }, style)}>
    <div class={css(classes.wrapper)}>
      <input id={name} {name} class={cx(css(classes.item), 'peer')} type="checkbox" bind:checked {...rest} />
      <Icon
        style={css.raw({
          display: 'none',
          position: 'absolute',
          top: '1/2',
          left: '1/2',
          translate: 'auto',
          translateX: '-1/2',
          translateY: '-1/2',
          color: 'white',
          cursor: 'pointer',
          _peerChecked: { display: 'block' },
        })}
        icon={CheckIcon}
        size={12}
      />
    </div>

    <span class={css(classes.text)}>
      {@render children?.()}
    </span>
  </label>
  {#if name}
    <div
      class={css({
        marginTop: '2px',
        marginLeft: size === 'sm' ? '22px' : '26px',
        fontSize: '13px',
        lineHeight: '[18px]',
        color: 'red.600',
        minHeight: '18px',
      })}
    >
      <FormValidationMessage for={name}>
        {#snippet children({ message })}
          * {message}
        {/snippet}
      </FormValidationMessage>
    </div>
  {/if}
</div>
