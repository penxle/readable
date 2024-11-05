<script lang="ts">
  import { run } from 'svelte/legacy';
  import { graphql } from '$graphql';

  run(() => {
    graphql(`
      query GoPage_Query($pageId: ID!) {
        publicPageById(pageId: $pageId) {
          id
          ...PageUrl_publicPage
        }
      }
    `);
  });
</script>
