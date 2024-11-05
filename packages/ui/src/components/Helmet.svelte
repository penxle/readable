<script lang="ts">
  import { page } from '$app/stores';

  type Props = {
    type?: string;
    title: string;
    trailing?: string;
    description?: string;
    image?: string | { src: string; size: 'small' | 'large' };
    struct?: Record<string, unknown>;
  };

  let { type = 'website', title, trailing = 'readable', description, image, struct }: Props = $props();

  const {
    url: { href },
  } = $page;

  let effectiveTitle = $derived(trailing ? `${title}${trailing ? ` · ${trailing}` : ''}` : title);
</script>

<svelte:head>
  <title>{effectiveTitle}</title>
  <meta content={effectiveTitle} property="og:title" />
  {#if description}
    <meta name="description" content={description} />
    <meta content={description} property="og:description" />
  {/if}
  {#if typeof image === 'string'}
    <meta content={image} property="og:image" />
    <meta content="summary" property="twitter:card" />
  {:else if typeof image === 'object'}
    <meta content={image.src} property="og:image" />
    {#if image.size === 'large'}
      <meta content="summary_large_image" property="twitter:card" />
    {:else}
      <meta content="summary" property="twitter:card" />
    {/if}
  {/if}
  <link {href} rel="canonical" />
  <meta content={href} property="og:url" />
  <meta content="Readable" property="og:site_name" />
  <meta content={type} property="og:type" />
  <meta content="ko_KR" property="og:locale" />
  {#if struct}
    {@html '<script type="application/ld+json">' + JSON.stringify(struct) + '</script>'}
  {/if}
</svelte:head>
