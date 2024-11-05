<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { Icon } from '@readable/ui/components';
  import mixpanel from 'mixpanel-browser';
  import ArrowUpRightIcon from '~icons/lucide/arrow-up-right';
  import { ProPlan } from '$assets/plan';
  import { isPlanUpgradeModalOpen, isPro, selectedPlan } from '$lib/svelte/stores/ui';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  type Props = {
    via: string;
    style?: SystemStyleObject;
  };

  let { via, style }: Props = $props();
</script>

{#if !$isPro}
  <button
    class={css(
      {
        display: 'flex',
        marginLeft: '8px',
        alignItems: 'center',
        gap: '2px',
        textStyle: '11sb',
        color: 'text.accent',
        backgroundColor: 'accent.10',
        borderRadius: '4px',
        height: '20px',
        paddingLeft: '6px',
        paddingRight: '4px',
      },
      style,
    )}
    onclick={() => {
      mixpanel.track('plan:upgrade:show', { via });
      isPlanUpgradeModalOpen.set(true);
      selectedPlan.set(ProPlan);
    }}
    type="button"
  >
    <span>PRO</span>
    <Icon icon={ArrowUpRightIcon} size={12} />
  </button>
{/if}
