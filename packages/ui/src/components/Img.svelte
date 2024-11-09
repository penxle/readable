<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import qs from 'query-string';
  import { base64 } from 'rfc4648';
  import { tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { thumbHashToDataURL } from 'thumbhash';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  type Size = 16 | 24 | 32 | 48 | 64 | 96 | 128 | 256 | 512 | 1024 | 'full';

  type Props = {
    url: string;
    placeholder?: string;
    ratio?: number;
    alt: string;
    style?: SystemStyleObject;
    size: Size;
    quality?: number;
    progressive?: boolean;
  };

  let { url, placeholder, ratio, alt, style, size, quality, progressive = false }: Props = $props();

  let containerEl = $state<HTMLElement>();
  let targetEl = $state<HTMLElement>();

  let loaded = $state(false);

  const src = $derived(qs.stringifyUrl({ url, query: { s: size === 'full' ? undefined : size, q: quality } }));
  const src2x = $derived(size !== 'full' && qs.stringifyUrl({ url, query: { s: size * 2, q: quality } }));
  const src3x = $derived(size !== 'full' && qs.stringifyUrl({ url, query: { s: size * 3, q: quality } }));

  const sizes = $derived(size === 'full' ? undefined : `${size}px`);
  const srcset = $derived(
    size === 'full' ? undefined : `${src} ${size}w, ${src2x} ${size * 2}w, ${src3x} ${size * 3}w`,
  );

  const placeholderUrl = $derived(
    progressive && placeholder ? thumbHashToDataURL(base64.parse(placeholder)) : undefined,
  );

  const load = () => {
    const imgEl = document.createElement('img');

    imgEl.addEventListener('load', async () => {
      loaded = true;
      await tick();
      targetEl?.append(imgEl);
    });

    if (srcset && sizes) {
      imgEl.sizes = sizes;
      imgEl.srcset = srcset;
    }

    imgEl.className = css({ size: 'full', objectFit: 'cover' }, style);
    imgEl.alt = alt;
    imgEl.src = src;
  };

  $effect(() => {
    if (containerEl) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load();
          observer.disconnect();
        }
      });

      observer.observe(containerEl);

      return () => {
        observer.disconnect();
      };
    }
  });
</script>

{#if placeholderUrl}
  <div
    bind:this={containerEl}
    style:aspect-ratio={ratio}
    class={css({
      position: 'relative',
      width: 'full',
      overflow: 'hidden',
    })}
  >
    <img class={css(style, { size: 'full', objectFit: 'cover' })} {alt} loading="lazy" src={placeholderUrl} />

    {#if loaded}
      <div bind:this={targetEl} class={css({ position: 'absolute', inset: '0' })} in:fade={{ duration: 200 }}></div>
    {/if}
  </div>
{:else}
  <img class={css(style)} {alt} loading="lazy" {sizes} {src} {srcset} />
{/if}
