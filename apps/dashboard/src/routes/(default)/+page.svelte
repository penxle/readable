<script lang="ts">
  import { run } from 'svelte/legacy';
  import { graphql } from '$graphql';

  run(() => {
    graphql(`
      query IndexPage_Query {
        me {
          id

          teams {
            id
          }
        }
      }
    `);
  });
</script>
