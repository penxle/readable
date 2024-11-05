<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, Icon } from '@readable/ui/components';
  import ReadableIcon from '~icons/rdbl/readable';
  import SlashDividerIcon from '~icons/rdbl/slash-divider';
  import { page } from '$app/stores';
  import { fragment, graphql } from '$graphql';
  import { Img } from '$lib/components';
  import FeedbackModal from './FeedbackModal.svelte';
  import SiteSwitcher from './SiteSwitcher.svelte';
  import TeamSwitcher from './TeamSwitcher.svelte';
  import UserMenu from './UserMenu.svelte';
  import type { Header_query } from '$graphql';

  type Props = {
    $query: Header_query;
  };

  let { $query: _query }: Props = $props();

  let query = $derived(
    fragment(
      _query,
      graphql(`
        fragment Header_query on Query {
          ...UserMenu_query

          me @required {
            id
            ...TeamSwitcher_user
          }

          team(teamId: $teamId) {
            id
            name
            avatar {
              id
              ...Img_image
            }

            sites {
              id
              name
              logo {
                id
                ...Img_image
              }
            }

            ...SiteSwitcher_team
          }
        }
      `),
    ),
  );

  let currentSiteId = $derived($page.params.siteId);
  let currentSite = $derived($query.team.sites.find((site) => site.id === currentSiteId));

  let isFeedbackModalOpen = $state(false);
</script>

<header
  class={flex({
    justifyContent: 'space-between',
    height: '48px',
    paddingLeft: '20px',
    paddingRight: '16px',
    paddingY: '10px',
    backgroundColor: 'surface.primary',
    borderBottomWidth: '1px',
    borderBottomColor: 'border.primary',
  })}
>
  <div
    class={flex({
      alignItems: 'center',
    })}
  >
    <a aria-label="홈" href="/">
      <Icon icon={ReadableIcon} size={24} />
    </a>
    <Icon icon={SlashDividerIcon} size={18} />
    <a
      class={flex({ alignItems: 'center', padding: '4px', gap: '8px' })}
      aria-current={$page.url.pathname === `/${$query.team.id}` ? 'page' : undefined}
      href={`/${$query.team.id}`}
    >
      <Img
        style={css.raw({ borderWidth: '1px', borderColor: 'border.image', borderRadius: 'full', size: '20px' })}
        $image={$query.team.avatar}
        alt={`${$query.team.name}의 로고`}
        size={24}
      />
      <h1 class={css({ textStyle: '14sb', truncate: true })}>
        {$query.team.name}
      </h1>
    </a>
    <TeamSwitcher $user={$query.me} />

    {#if currentSite}
      <Icon icon={SlashDividerIcon} size={18} />
      <a
        class={flex({
          alignItems: 'center',
          padding: '4px',
          gap: '8px',
        })}
        aria-current="page"
        href={`/${$query.team.id}/${currentSite.id}`}
      >
        {#if currentSite.logo}
          <Img
            style={css.raw({ borderRadius: '4px', size: '20px' })}
            $image={currentSite.logo}
            alt={`${currentSite.name}의 로고`}
            size={24}
          />
        {/if}
        <span class={css({ textStyle: '14sb', truncate: true })}>
          {currentSite.name}
        </span>
      </a>
      <SiteSwitcher $team={$query.team} />
    {/if}
  </div>

  <div class={flex({ alignItems: 'center', gap: '24px' })}>
    <Button
      style={css.raw({
        color: 'text.tertiary',
        height: '28px',
        paddingX: '12px',
        paddingY: '4px',
        textStyle: '14sb',
        borderRadius: '4px',
      })}
      size="sm"
      type="button"
      variant="secondary"
      on:click={() => {
        isFeedbackModalOpen = true;
      }}
    >
      피드백
    </Button>
    <a
      class={css({
        textStyle: '14sb',
        color: 'text.tertiary',
        _hover: { textDecoration: 'underline' },
      })}
      href="https://docs.rdbl.io"
      rel="noopener noreferrer"
      target="_blank"
    >
      이용 가이드
    </a>
    <UserMenu {$query} teamId={$query.team.id} />
  </div>
</header>

<FeedbackModal teamId={$query.team.id} bind:open={isFeedbackModalOpen} />
