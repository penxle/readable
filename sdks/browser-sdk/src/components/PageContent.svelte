<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';

  type Props = {
    siteUrl: string;
    pageId: string;
  };

  let { siteUrl, pageId }: Props = $props();
</script>

<div class={flex({ flexGrow: '1', position: 'relative', paddingX: '20px' })}>
  <div
    class={css({
      position: 'absolute',
      top: '0',
      left: '0',
      width: 'full',
      height: '32px',
      bgGradient: 'to-b',
      gradientFrom: 'white',
      gradientTo: 'white/0',
    })}
  ></div>
  <iframe class={css({ flexGrow: '1', width: 'full' })} src={`${siteUrl}/_/render/${pageId}`} title=""></iframe>
  <div
    class={css({
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: 'full',
      height: '32px',
      bgGradient: 'to-t',
      gradientFrom: 'white',
      gradientTo: 'white/0',
    })}
  ></div>
</div>
