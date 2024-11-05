<script lang="ts">
  import { graphql } from '$graphql';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const query = graphql(`
    query IndexPage_Query {
      publicSite {
        id

        firstPage {
          id
          ...PageUrl_publicPage
        }
      }
    }
  `);
</script>
