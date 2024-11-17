<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';

  type Props = {
    siteUrl: string;
    pageId: string;
  };

  let { siteUrl, pageId }: Props = $props();
</script>

<div class={flex({ flexGrow: '1', paddingX: '16px' })}>
  <iframe class={css({ flexGrow: '1', width: 'full' })} src={`${siteUrl}/r/${pageId}`} title=""></iframe>
</div>
