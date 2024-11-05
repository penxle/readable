<script lang="ts">
  import { graphql } from '$graphql';
  import LeftSideBar from '../LeftSideBar.svelte';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();

  let query = $derived(
    graphql(`
      query SitePageLayout_Query($siteId: ID!) {
        site(siteId: $siteId) {
          id
          ...LeftSideBar_site
        }
      }
    `),
  );
</script>

<LeftSideBar $site={$query.site} />

{@render children?.()}
