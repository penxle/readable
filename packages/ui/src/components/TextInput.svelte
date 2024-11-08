<script lang="ts">
  import { css, cva, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { getFormContext } from '../forms';
  import Icon from './Icon.svelte';
  import type { RecipeVariantProps, SystemStyleObject } from '@readable/styled-system/types';
  import type { Component, Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  type Props = {
    name?: string;
    style?: SystemStyleObject;
    inputEl?: HTMLInputElement;
    leftIcon?: Component;
    rightIcon?: Component;
    hidden?: boolean;
    leftItem?: Snippet;
    rightItem?: Snippet;
  } & RecipeVariantProps<typeof recipe> &
    Omit<HTMLInputAttributes, 'class' | 'style' | 'size'>;

  let {
    name = $bindable(),
    value = $bindable(),
    style,
    size = 'lg',
    inputEl = $bindable(),
    leftIcon,
    rightIcon,
    hidden = false,
    leftItem,
    rightItem,
    ...rest
  }: Props = $props();

  const { field } = getFormContext();

  if (field) {
    name = field.name;
  }

  const recipe = cva({
    base: {
      display: 'flex',
      alignItems: 'center',
      borderWidth: '1px',
      borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
      color: { base: 'gray.500', _dark: 'darkgray.400' },
      backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
      transition: 'common',
      _hover: {
        borderColor: { base: 'brand.400', _dark: 'brand.300' },
      },
      _hasFocusedInput: {
        borderColor: { base: 'brand.600', _dark: 'brand.500' },
      },
      _hasFilledInput: {
        color: { base: 'gray.1000', _dark: 'darkgray.100' },
        borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
      },
      _hasDisabledInput: {
        color: { base: 'gray.500', _dark: 'darkgray.600' },
        backgroundColor: { base: 'gray.200', _dark: 'darkgray.900' },
        borderColor: { base: 'gray.200', _dark: 'darkgray.700' },
      },
      _hasReadonlyInput: {
        color: 'text.tertiary',
        backgroundColor: { base: 'gray.200', _dark: 'darkgray.900' },
        borderColor: { base: 'gray.200', _dark: 'darkgray.700' },
      },
      _hasInvalidInput: {
        borderColor: { base: 'red.600', _dark: 'red.500' },
        _hasFocusedInput: {
          borderColor: { base: 'red.600', _dark: 'red.500' },
        },
        _hasFilledInput: {
          color: { base: 'gray.1000', _dark: 'darkgray.100' },
          backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
        },
      },
    },
    variants: {
      size: {
        sm: {
          borderRadius: '6px',
          textStyle: '14r',
          height: '32px',
          paddingX: '12px',
        },
        md: {
          borderRadius: '8px',
          textStyle: '14m',
          height: '38px',
          paddingX: '12px',
        },
        lg: {
          borderRadius: '10px',
          textStyle: '16r',
          height: '43px',
          paddingX: '16px',
        },
      },
    },
  });
</script>

<label class={cx(recipe({ size }), css(style))} for={name} {hidden}>
  {#if leftIcon}
    <div class={flex({ align: 'center', marginRight: '8px' })}>
      <Icon icon={leftIcon} size={18} />
    </div>
  {/if}

  {#if leftItem}
    <div class={css({ marginRight: '8px' })}>
      {@render leftItem()}
    </div>
  {/if}

  <input
    bind:this={inputEl}
    id={name}
    {name}
    class={css({ flexGrow: '1', width: 'full', minWidth: '0' })}
    type="text"
    bind:value
    {...rest}
    aria-live={value ? 'polite' : 'off'}
  />

  {#if rightIcon}
    <div class={flex({ align: 'center', marginLeft: '20px' })}>
      <Icon icon={rightIcon} size={18} />
    </div>
  {/if}

  {#if rightItem}
    <div class={css({ marginLeft: '8px' })}>
      {@render rightItem()}
    </div>
  {/if}
</label>
