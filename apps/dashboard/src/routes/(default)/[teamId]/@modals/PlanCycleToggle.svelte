<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';

  type Props = {
    defaultValue?: 'MONTHLY' | 'YEARLY';
    onselect?: (value: 'MONTHLY' | 'YEARLY') => void;
  };

  let { defaultValue = 'MONTHLY', onselect }: Props = $props();

  let selectedValue = $state(defaultValue);

  $effect(() => {
    onselect?.(selectedValue);
  });

  const selectedIndex = $derived(selectedValue === 'MONTHLY' ? 0 : 1);

  const length = 2;
</script>

<div
  class={flex({
    position: 'relative',
    gap: '4px',
    padding: '4px',
    borderRadius: '10px',
    backgroundColor: 'neutral.20',
  })}
>
  <div
    style:left={`calc(4px + ${selectedIndex} * ((100% - ${4 * (length + 1)}px) / ${length} + 4px))`}
    style:width={`calc((100% - ${4 * (length + 1)}px) / ${length})`}
    class={css({
      position: 'absolute',
      height: '36px',
      borderRadius: '6px',
      background: 'white',
      borderWidth: '1px',
      borderColor: 'border.secondary',
      transition: '[left 100ms cubic-bezier(0.3, 0, 0, 1)]',
    })}
    aria-hidden="true"
  ></div>
  <button
    class={css({
      flex: '1',
      height: '36px',
      textStyle: '16m',
      zIndex: '1',
      color: 'text.tertiary',
      _selected: {
        color: 'text.primary',
      },
    })}
    aria-selected={selectedValue === 'MONTHLY'}
    onclick={() => (selectedValue = 'MONTHLY')}
    role="tab"
    type="button"
  >
    월 결제
  </button>
  <button
    class={css({
      flex: '1',
      height: '36px',
      textStyle: '16m',
      zIndex: '1',
      color: 'text.tertiary',
      _selected: {
        color: 'text.primary',
      },
    })}
    aria-selected={selectedValue === 'YEARLY'}
    onclick={() => (selectedValue = 'YEARLY')}
    role="tab"
    type="button"
  >
    <div class={flex({ position: 'relative', gap: '8px', alignItems: 'center', justifyContent: 'center' })}>
      <span>연 결제</span>
      <div
        class={css({
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          textStyle: '11b',
          color: 'white',
          borderRadius: '4px',
          paddingX: '4px',
          paddingY: '2px',
          backgroundColor: 'accent.60',
        })}
      >
        30% 할인
      </div>
    </div>
  </button>
</div>
