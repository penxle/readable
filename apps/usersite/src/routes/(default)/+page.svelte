<script lang="ts">
  import { run } from 'svelte/legacy';
  import { graphql } from '$graphql';

  run(() => {
    graphql(`
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
  });
</script>
