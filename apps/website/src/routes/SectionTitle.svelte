<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { center } from '@readable/styled-system/patterns';
  import { onMount } from 'svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';

  type Props = {
    subtitle?: Snippet;
    title?: Snippet;
    description?: Snippet;
    color: string;
    style?: SystemStyleObject;
    animateEl?: HTMLElement;
    visible: boolean;
  };

  let { subtitle, title, description, color, style, animateEl, visible = $bindable() }: Props = $props();

  onMount(() => {
    if (animateEl) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          visible = true;
        }
      });

      observer.observe(animateEl);

      return () => observer.disconnect();
    }
  });
</script>

<div
  bind:this={animateEl}
  class={cx(
    'animate',
    visible && 'loaded',
    css(
      {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
        lgDown: {
          gap: '10px',
        },
      },
      style,
    ),
  )}
>
  <div
    style:background-color={color}
    class={center({
      textStyle: '14sb',
      borderRadius: '[24px]',
      color: 'white',
      paddingX: '14px',
      paddingY: '6px',
      marginBottom: '4px',
    })}
  >
    {@render subtitle?.()}
  </div>

  <h1
    class={css({
      fontSize: '[36px]',
      fontWeight: '[800]',
      lineHeight: '[140%]',
      lgDown: {
        fontSize: '28px',
      },
    })}
  >
    {@render title?.()}
  </h1>

  <div
    class={css({
      fontSize: '0',
      '& > * > span': {
        fontSize: '18px',
        fontWeight: '[500]',
        color: 'text.tertiary',
        lgDown: {
          fontSize: '16px',
        },
      },
      '& > * > em': {
        fontSize: '18px',
        fontWeight: '[700]',
        color: 'text.primary',
        lgDown: {
          fontSize: '16px',
        },
      },
    })}
  >
    {@render description?.()}
  </div>
</div>
