<script lang="ts" module>
  import { graphql } from '$graphql';

  export const sitemapQuery = graphql(`
    query Sitemap_Query @manual {
      publicSite {
        id

        pages {
          id
          ...PageUrl_publicPage
        }
      }
    }
  `);
</script>
