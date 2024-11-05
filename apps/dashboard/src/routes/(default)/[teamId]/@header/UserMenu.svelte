<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { HorizontalDivider, Icon, Menu, MenuItem } from '@readable/ui/components';
  import mixpanel from 'mixpanel-browser';
  // import BookMinusIcon from '~icons/lucide/book-minus';
  import Building2Icon from '~icons/lucide/building-2';
  import CircleUserRoundIcon from '~icons/lucide/circle-user-round';
  // import InfoIcon from '~icons/lucide/info';
  import LogOutIcon from '~icons/lucide/log-out';
  import { page } from '$app/stores';
  import { fragment, graphql } from '$graphql';
  import { Img } from '$lib/components';
  import { accessToken } from '$lib/graphql';
  import UserSettingModal from './UserSettingModal.svelte';
  import type { UserMenu_query } from '$graphql';

  type Props = {
    $query: UserMenu_query;
    teamId?: string | undefined;
  };

  let { $query: _query, teamId = undefined }: Props = $props();

  let openUserSettingModal = $state(false);

  $effect(() => {
    const tab = $page.url.searchParams.get('tab');
    openUserSettingModal = !!tab && (tab === 'settings/personal' || tab.startsWith('settings/team'));
  });

  const query = fragment(
    _query,
    graphql(`
      fragment UserMenu_query on Query {
        me @required {
          id
          name
          email
          ...UserSettingModal_user

          avatar {
            id
            ...Img_image
          }
        }
      }
    `),
  );

  const logout = graphql(`
    mutation UserMenu_Logout_Mutation {
      logout
    }
  `);
</script>

<Menu style={css.raw({ height: 'fit' })} listStyle={css.raw({ width: '[180px!]' })} placement="top">
  {#snippet button()}
    <div>
      <Img
        style={css.raw({
          borderWidth: '1px',
          borderColor: 'border.image',
          borderRadius: 'full',
          size: '32px',
        })}
        $image={$query.me.avatar}
        alt={`${$query.me.name}의 아바타`}
        size={32}
      />
    </div>
  {/snippet}

  <li class={css({ paddingX: '6px' })}>
    <div
      class={flex({
        align: 'center',
        gap: '6px',
        borderRadius: '6px',
        paddingX: '12px',
        paddingY: '7px',
        backgroundColor: 'neutral.10',
      })}
    >
      <Img
        style={css.raw({
          flex: 'none',
          borderWidth: '1px',
          borderColor: 'border.image',
          borderRadius: 'full',
          size: '32px',
        })}
        $image={$query.me.avatar}
        alt={`${$query.me.name}의 아바타`}
        size={32}
      />

      <div class={css({ truncate: true })}>
        <p class={css({ textStyle: '14sb', color: 'text.secondary', truncate: true })}>{$query.me.name}</p>
        <p class={css({ textStyle: '12m', color: 'text.tertiary', truncate: true })}>{$query.me.email}</p>
      </div>
    </div>
  </li>

  {#if teamId}
    <MenuItem external={false} href="/{teamId}/settings" type="link">
      <Icon icon={Building2Icon} size={14} />
      <span>팀 설정</span>
    </MenuItem>
  {/if}
  <MenuItem external={false} href="?tab=settings/personal" type="link">
    <Icon icon={CircleUserRoundIcon} size={14} />
    <span>개인 설정</span>
  </MenuItem>

  <HorizontalDivider />

  <!-- <MenuItem>
    <Icon icon={InfoIcon} size={14} />
    <span>문의하기</span>
  </MenuItem>
  <MenuItem>
    <Icon icon={BookMinusIcon} size={14} />
    <span>사용가이드</span>
  </MenuItem>

  <HorizontalDivider /> -->

  <MenuItem
    onclick={async () => {
      await logout();
      $accessToken = null;

      mixpanel.track('user:logout', {
        via: 'user_menu',
      });
      mixpanel.reset();

      location.href = '/';
    }}
    type="button"
  >
    <Icon icon={LogOutIcon} size={14} />
    <span>로그아웃</span>
  </MenuItem>
</Menu>

<UserSettingModal $user={$query.me} open={openUserSettingModal} />
