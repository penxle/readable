<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';
  import { page } from '$app/stores';
  import { graphql } from '$graphql';
  import { Tabs } from '$lib/components';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();

  let query = $derived(
    graphql(`
      query TeamDashboardLayout_Query($teamId: ID!) {
        team(teamId: $teamId) {
          id
          name

          sites {
            id
          }

          members {
            id
          }
        }
      }
    `),
  );
</script>

<nav
  class={flex({
    align: 'center',
    borderBottomWidth: '1px',
    borderColor: 'border.secondary',
    paddingX: '20px',
    height: '46px',
  })}
>
  <Tabs
    tabs={[
      {
        title: '사이트',
        path: `/${$query.team.id}`,
        selected: $page.url.pathname === `/${$query.team.id}`,
        badge: $query.team.sites.length,
      },
      {
        title: '멤버',
        path: `/${$query.team.id}/members`,
        selected: $page.url.pathname === `/${$query.team.id}/members`,
        badge: $query.team.members.length,
      },
      {
        title: '팀 설정',
        path: `/${$query.team.id}/settings`,
        selected: $page.url.pathname.startsWith(`/${$query.team.id}/settings`),
      },
    ]}
  />
</nav>

<div
  class={flex({
    direction: 'column',
    grow: '1',
    paddingX: '20px',
    backgroundColor: 'surface.secondary',
    overflow: 'auto',
  })}
>
  {@render children?.()}
</div>
