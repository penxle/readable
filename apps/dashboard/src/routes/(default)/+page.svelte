<script lang="ts">
  import { graphql } from '$graphql';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const query = graphql(`
    query IndexPage_Query {
      me {
        id

        teams {
          id
        }
      }
    }
  `);
</script>
