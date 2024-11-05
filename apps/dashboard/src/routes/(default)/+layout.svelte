<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';
  import mixpanel from 'mixpanel-browser';
  import qs from 'query-string';
  import { run } from 'svelte/legacy';
  import { browser, dev } from '$app/environment';
  import { graphql } from '$graphql';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();

  let query = $derived(
    graphql(`
      query DefaultLayout_Query {
        me {
          id
          name
          email

          avatar {
            id
            url
          }
        }
      }
    `),
  );

  run(() => {
    if (browser && $query.me) {
      mixpanel.identify($query.me.id);

      mixpanel.people.set({
        $email: $query.me.email,
        $name: $query.me.name,
        $avatar: qs.stringifyUrl({ url: $query.me.avatar.url, query: { s: 256, f: 'png' } }),
      });
    }
  });
</script>

<svelte:head>
  <script
    data-site-id="S0000000DOCS"
    defer
    src={dev ? 'http://localhost:3100/script.js' : 'https://sdk.rdbl.io/script.js'}
  ></script>
</svelte:head>

<div
  class={flex({
    direction: 'column',
    grow: 1,
    minWidth: '1280px',
    minHeight: 'screen',
  })}
>
  {@render children?.()}
</div>
