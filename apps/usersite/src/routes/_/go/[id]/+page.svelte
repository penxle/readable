<script lang="ts">
  import { graphql } from '$graphql';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const query = graphql(`
    query GoPage_Query($pageId: ID!) {
      publicPageById(pageId: $pageId) {
        id
        ...PageUrl_publicPage
      }
    }
  `);
</script>
