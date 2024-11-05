<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import IconExternalLink from '~icons/lucide/external-link';
  import IconLink2 from '~icons/lucide/link-2';
  import IconPaintbrushVertical from '~icons/lucide/paintbrush-vertical';
  import IconSettings from '~icons/lucide/settings';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { SettingTabItem } from '$lib/components';

  let { data, children } = $props();

  const settings = $derived([
    {
      name: '일반',
      href: `/${data.props.teamId}/${data.props.siteId}/settings`,
      icon: IconSettings,
      selected: $page.url.pathname === `/${data.props.teamId}/${data.props.siteId}/settings`,
    },
    {
      name: '테마 색상',
      href: `/${data.props.teamId}/${data.props.siteId}/settings/theme`,
      icon: IconPaintbrushVertical,
      selected: $page.url.pathname === `/${data.props.teamId}/${data.props.siteId}/settings/theme`,
    },
    {
      name: '커스텀 도메인',
      href: `/${data.props.teamId}/${data.props.siteId}/settings/domain`,
      icon: IconLink2,
      selected: $page.url.pathname === `/${data.props.teamId}/${data.props.siteId}/settings/domain`,
    },
    {
      name: '헤더 링크 버튼',
      href: `/${data.props.teamId}/${data.props.siteId}/settings/link`,
      icon: IconExternalLink,
      selected: $page.url.pathname === `/${data.props.teamId}/${data.props.siteId}/settings/link`,
    },
  ]);

  let container = $state<HTMLDivElement>();

  afterNavigate(() => {
    container?.scrollTo({ top: 0, behavior: 'auto' });
  });
</script>

<div
  bind:this={container}
  class={flex({
    justifyContent: 'center',
    backgroundColor: 'surface.secondary',
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
    <nav class={flex({ direction: 'column', gap: '1px' })}>
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
    {@render children()}
  </div>
</div>
