<script lang="ts">
  import { graphql } from '$graphql';
  import Img from './Img.svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { ComponentProps } from 'svelte';

  type Size = ComponentProps<typeof Img>['size'];

  type Props = {
    id: string;
    alt: string;
    style?: SystemStyleObject;
    size: Size;
    quality?: number;
    progressive?: boolean;
  };

  let { id, alt, style, size, quality, progressive = false }: Props = $props();

  const query = graphql(`
    query LoadableImg_Query($id: ID!) @manual {
      image(id: $id) {
        id
        ...Img_image
      }
    }
  `);

  $effect(() => {
    query.refetch({ id });
  });
</script>

{#if $query}
  <Img {style} $image={$query.image} {alt} {progressive} {quality} {size} />
{/if}
