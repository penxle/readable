<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import mixpanel from 'mixpanel-browser';
  import { onDestroy, setContext } from 'svelte';
  import { run } from 'svelte/legacy';
  import MousePointerClickIcon from '~icons/lucide/mouse-pointer-click';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { graphql } from '$graphql';
  import { Tabs } from '$lib/components';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();

  let query = $derived(
    graphql(`
      query SiteLayout_Query($siteId: ID!) {
        me @required {
          id
        }

        site(siteId: $siteId) {
          id
          name
          url
          themeColor

          team {
            id

            meAsMember {
              id
              role
            }
          }

          logo {
            id
            ...Img_image
          }
        }
      }
    `),
  );

  const siteUpdateStream = graphql(`
    subscription SiteLayout_SiteUpdateStream_Subscription($siteId: ID!) {
      siteUpdateStream(siteId: $siteId) {
        ... on Site {
          id
          ...LeftSideBar_site
        }

        ... on Page {
          id
          state
          hasUnpublishedChanges
          title
        }
      }
    }
  `);

  let unsubscribe: (() => void) | null = $state(null);

  run(() => {
    if (browser) {
      unsubscribe?.();

      unsubscribe = siteUpdateStream.subscribe({
        siteId: $query.site.id,
      });

      mixpanel.register({
        site_id: $query.site.id,
      });
    }
  });

  onDestroy(() => {
    mixpanel.unregister('site_id');
    unsubscribe?.();
  });

  run(() => {
    setContext('site', $query.site);
  });
</script>

<div style:--usersite-theme-color={$query.site.themeColor} class={css({ display: 'contents' })}>
  <nav
    class={flex({
      align: 'center',
      justify: 'space-between',
      borderBottomWidth: '1px',
      borderColor: 'border.secondary',
      paddingX: '20px',
      height: '46px',
    })}
  >
    <Tabs
      tabs={[
        {
          title: '페이지',
          path: `/${$query.site.team.id}/${$query.site.id}`,
          selected:
            $page.url.pathname.startsWith(`/${$query.site.team.id}/${$query.site.id}`) &&
            !$page.url.pathname.startsWith(`/${$query.site.team.id}/${$query.site.id}/settings`),
        },
        ...($query.site.team.meAsMember?.role === 'ADMIN'
          ? [
              {
                title: '사이트 설정',
                path: `/${$query.site.team.id}/${$query.site.id}/settings`,
                selected: $page.url.pathname.startsWith(`/${$query.site.team.id}/${$query.site.id}/settings`),
              },
            ]
          : []),
      ]}
    />

    <a
      class={flex({
        align: 'center',
        gap: '6px',
        borderWidth: '1px',
        borderColor: 'border.secondary',
        borderRadius: '4px',
        paddingX: '8px',
        paddingY: '4px',
        color: 'text.tertiary',
        textStyle: '14sb',
        backgroundColor: { base: 'neutral.10', _hover: 'neutral.20', _pressed: 'neutral.30' },
      })}
      href={$query.site.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Icon icon={MousePointerClickIcon} />
      사이트 바로가기
    </a>
  </nav>

  <div
    class={flex({
      grow: '1',
      overflow: 'auto',
    })}
  >
    {@render children?.()}
  </div>
</div>
