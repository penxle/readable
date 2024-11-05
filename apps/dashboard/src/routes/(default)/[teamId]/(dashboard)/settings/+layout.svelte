<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import CreditCardIcon from '~icons/lucide/credit-card';
  import MapIcon from '~icons/lucide/map';
  import SettingsIcon from '~icons/lucide/settings';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { graphql } from '$graphql';
  import { SettingTabItem } from '$lib/components';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();

  let query = $derived(
    graphql(`
      query TeamSettingsLayout_Query($teamId: ID!) {
        team(teamId: $teamId) {
          id

          meAsMember {
            id
            role
          }
        }
      }
    `),
  );

  let settings = $derived([
    {
      name: '일반',
      href: `/${$page.params.teamId}/settings`,
      icon: SettingsIcon,
      selected: $page.url.pathname === `/${$page.params.teamId}/settings`,
    },
    ...($query.team.meAsMember?.role === 'ADMIN'
      ? [
          {
            name: '플랜',
            href: `/${$page.params.teamId}/settings/plan`,
            icon: MapIcon,
            selected: $page.url.pathname === `/${$page.params.teamId}/settings/plan`,
          },
          {
            name: '결제 및 청구',
            href: `/${$page.params.teamId}/settings/billing`,
            icon: CreditCardIcon,
            selected: $page.url.pathname === `/${$page.params.teamId}/settings/billing`,
          },
        ]
      : []),
  ]);

  let container: HTMLDivElement = $state();

  afterNavigate(() => {
    container.scrollTo({ top: 0, behavior: 'auto' });
  });
</script>

<div
  bind:this={container}
  class={flex({
    justifyContent: 'center',
    width: 'full',
    minHeight: 'full',
    overflow: 'auto',
  })}
>
  <aside
    class={css({
      position: 'sticky',
      top: '0',
      borderRightWidth: '1px',
      borderRightColor: 'border.secondary',
      paddingTop: '60px',
      paddingRight: '32px',
      paddingBottom: '20px',
      minWidth: '218px',
    })}
  >
    <nav class={flex({ direction: 'column', gap: '2px' })}>
      {#each settings as setting (setting.href)}
        <SettingTabItem {setting} />
      {/each}
    </nav>
  </aside>

  <div
    class={css({
      width: '702px',
      paddingTop: '40px',
      paddingLeft: '32px',
      paddingBottom: '120px',
      height: 'fit',
    })}
  >
    {@render children?.()}
  </div>
</div>
