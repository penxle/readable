<script lang="ts">
  import { run } from 'svelte/legacy';
  import { browser } from '$app/environment';
  import { graphql } from '$graphql';
  import Img from './Img.svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { ComponentProps } from 'svelte';

  type Size = ComponentProps<Img>['size'];

  type Props = {
    id: string;
    alt: string;
    style?: SystemStyleObject | undefined;
    size: Size;
    quality?: number | undefined;
    progressive?: boolean;
  };

  let { id, alt, style = undefined, size, quality = undefined, progressive = false }: Props = $props();

  let query = $derived(
    graphql(`
      query LoadableImg_Query($id: ID!) @manual {
        image(id: $id) {
          id
          ...Img_image
        }
      }
    `),
  );

  run(() => {
    if (browser) {
      query.refetch({ id });
    }
  });
</script>

{#if $query}
  <Img {style} $image={$query.image} {alt} {progressive} {quality} {size} />
{/if}
