<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { Img, MarkdownRenderer } from '@readable/ui/components';
  import { fly } from 'svelte/transition';
  import AiLoading from '../assets/AiLoading.svelte';
  import SparklesSmall from '../assets/SparklesSmall.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    site: {
      name: string;
      logoUrl: string | null;
    };
    loading?: boolean;
    message?: string;
    content?: Snippet;
    title?: string;
  };
  const { site, loading, message, content, title }: Props = $props();
</script>

<div class={flex({ gap: '8px', alignItems: 'flex-start', width: 'full' })}>
  {#if site.logoUrl}
    <Img
      style={css.raw({
        flexShrink: 0,
        size: '28px',
        borderRadius: 'full',
        borderWidth: '1px',
        borderColor: 'border.image',
      })}
      alt={site.name}
      size={32}
      url={site.logoUrl}
    />
  {:else}
    <div
      class={center({
        flexShrink: 0,
        size: '28px',
        borderRadius: 'full',
        borderWidth: '1px',
        borderColor: 'border.image',
      })}
    >
      <SparklesSmall />
    </div>
  {/if}
  {#if loading}
    <div class={center({ height: '28px' })} in:fly|global={{ y: 10 }}>
      <AiLoading />
    </div>
  {:else}
    {#if message}
      <div
        class={css({
          borderWidth: '1px',
          borderColor: '[var(--widget-theme-color)/10]',
          borderRadius: '10px',
          paddingX: '12px',
          paddingY: '10px',
          backgroundColor: '[var(--widget-theme-color)/6]',
          width: 'full',
          whiteSpace: 'pre-line',
        })}
        in:fly|global={{ y: 10 }}
      >
        <MarkdownRenderer source={message} />
      </div>
    {/if}
    {#if content}
      <div
        class={flex({
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-start',
          maxWidth: 'full',
          overflow: 'hidden',
        })}
        in:fly|global={{ y: 10 }}
      >
        {#if title}
          <p class={css({ textStyle: '12m', color: 'text.tertiary' })}>
            {title}
          </p>
        {/if}
        {@render content?.()}
      </div>
    {/if}
  {/if}
</div>
