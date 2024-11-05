<script lang="ts">
  import { Img } from '@readable/ui/components';
  import { fragment, graphql } from '$graphql';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { ComponentProps } from 'svelte';
  import type { Img_image } from '$graphql';

  type Size = ComponentProps<typeof Img>['size'];

  type Props = {
    $image: Img_image;
    alt: string;
    style?: SystemStyleObject;
    size: Size;
    quality?: number;
    progressive?: boolean;
  };

  let { $image: _image, alt, style, size, quality, progressive = false }: Props = $props();

  const image = fragment(
    _image,
    graphql(`
      fragment Img_image on Image {
        id
        url
        ratio
        placeholder
      }
    `),
  );
</script>

<Img
  {style}
  {alt}
  placeholder={$image.placeholder}
  {progressive}
  {quality}
  ratio={$image.ratio}
  {size}
  url={$image.url}
/>
