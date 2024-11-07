<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center } from '@readable/styled-system/patterns';
  import qs from 'query-string';
  import { base64 } from 'rfc4648';
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { thumbHashToDataURL } from 'thumbhash';
  import RingSpinner from './RingSpinner.svelte';
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

  let containerEl = $state<HTMLDivElement>();
  let contentEl = $state<HTMLDivElement>();
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

  const load = async () => {
    const imgEl = new Image();

    const onload = async () => {
      if (loaded) {
        return;
      }

      loaded = true;
      await tick();

      contentEl?.prepend(imgEl);
    };

    imgEl.addEventListener('load', onload);

    imgEl.className = css(style);
    if (sizes) imgEl.sizes = sizes;
    if (srcset) imgEl.srcset = srcset;
    imgEl.src = src;
    imgEl.alt = alt;

    await tick();

    if (imgEl.complete) {
      onload();
    }
  };

  onMount(() => {
    if (containerEl) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      });

      observer.observe(containerEl);

      return () => observer.disconnect();
    }
  });
</script>

<svelte:head>
  {#if placeholderUrl}
    <link as="image" href={src} imagesizes={sizes} imagesrcset={srcset} rel="preload" />
  {/if}
</svelte:head>

{#if placeholderUrl}
  <div
    bind:this={containerEl}
    class={css({
      position: 'relative',
      width: 'full',
      overflow: 'hidden',
    })}
  >
    <img
      style:aspect-ratio={ratio}
      class={css({ objectFit: 'cover' }, style)}
      {alt}
      loading="lazy"
      src={placeholderUrl}
    />
    {#if loaded}
      <div bind:this={contentEl} class={css({ position: 'absolute', inset: '0' })} in:fade={{ duration: 200 }}></div>
    {:else}
      <div class={center({ position: 'absolute', inset: '0' })}>
        <RingSpinner style={css.raw({ size: '20px' })} />
      </div>
    {/if}
  </div>
{:else}
  <img class={css(style)} {alt} loading="lazy" {sizes} {src} {srcset} />
{/if}
