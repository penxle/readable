<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { scrollLock } from '@readable/ui/actions';
  import { Dialog, Icon } from '@readable/ui/components';
  import CircleUserIcon from '~icons/lucide/circle-user';
  import XIcon from '~icons/lucide/x';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { fragment, graphql } from '$graphql';
  import { Img, SettingTabItem } from '$lib/components';
  import UserSetting from './setting-modal/UserSetting.svelte';
  import type { UserSettingModal_user } from '$graphql';

  type Props = {
    $user: UserSettingModal_user;
    open?: boolean;
  };

  let { $user: _user, open = false }: Props = $props();

  const selectedTab = $derived($page.url.searchParams.get('tab'));

  const user = fragment(
    _user,
    graphql(`
      fragment UserSettingModal_user on User {
        id
        name
        email
        ...UserSetting_user

        avatar {
          id
          ...Img_image
        }
      }
    `),
  );

  const personalSettings = $derived([
    {
      icon: CircleUserIcon,
      name: '개인 설정',
      href: '?tab=settings/personal',
      selected: selectedTab === 'settings/personal',
    },
  ]);

  const closeModal = () => {
    const currentPath = $page.url.pathname;
    goto(currentPath, { replaceState: true });
  };
</script>

<Dialog onclose={closeModal} {open}>
  <div
    class={flex({
      position: 'fixed',
      inset: '0',
      width: 'screen',
      height: 'screen',
      backgroundColor: 'surface.primary',
      overflow: 'auto',
    })}
  >
    <div
      class={css({
        position: 'absolute',
        left: '0',
        width: '1/2',
        height: 'full',
        backgroundColor: 'surface.secondary',
      })}
      aria-hidden="true"
    ></div>

    <div
      class={flex({
        position: 'relative',
        marginX: 'auto',
        overflow: 'auto',
        minWidth: '1064px',
      })}
      use:scrollLock
    >
      <div
        class={flex({
          flexDirection: 'column',
          flex: 'none',
          minWidth: '240px',
          width: '[30%]',
          maxWidth: '280px',
          paddingX: '20px',
          paddingY: '60px',
          overflow: 'auto',
        })}
      >
        <div
          class={flex({
            align: 'center',
            gap: '10px',
            marginBottom: '2px',
            paddingLeft: '12px',
            paddingRight: '10px',
            paddingY: '5px',
            alignItems: 'center',
          })}
        >
          <Img
            style={css.raw({
              flex: 'none',
              borderWidth: '1px',
              borderColor: 'border.image',
              borderRadius: 'full',
              size: '18px',
            })}
            $image={$user.avatar}
            alt={`${$user.name}의 아바타`}
            size={24}
          />

          <p class={css({ textStyle: '13sb', truncate: true, color: 'text.secondary' })}>{$user.name}</p>
        </div>

        <dl class={flex({ direction: 'column', gap: '2px', paddingTop: '1px' })}>
          {#each personalSettings as setting (setting.name)}
            <dd>
              <SettingTabItem {setting} />
            </dd>
          {/each}
        </dl>
      </div>

      <div
        class={flex({
          width: '784px',
          height: 'full',
          flexDirection: 'column',
          backgroundColor: 'surface.primary',
          paddingY: '60px',
          paddingX: '32px',
          overflow: 'auto',
        })}
      >
        {#if selectedTab === 'settings/personal'}
          <UserSetting {$user} />
        {/if}
      </div>

      <div class={css({ paddingTop: '58px', paddingLeft: '20px' })}>
        <button
          class={center({
            borderWidth: '[1.5px]',
            borderColor: 'neutral.30',
            borderRadius: 'full',
            marginBottom: '4px',
            color: 'neutral.50',
            size: '40px',
            backgroundColor: 'surface.primary',
            boxShadow: 'normal',
            zIndex: '30',
            _hover: {
              borderColor: 'neutral.50',
              color: 'neutral.70',
            },
          })}
          aria-label="닫기"
          onclick={closeModal}
          type="button"
        >
          <Icon icon={XIcon} />
        </button>
        <span class={css({ display: 'block', textStyle: '13sb', color: 'text.tertiary', textAlign: 'center' })}>
          ESC
        </span>
      </div>
    </div>
  </div>
</Dialog>
