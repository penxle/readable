<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { Icon } from '@readable/ui/components';
  import mixpanel from 'mixpanel-browser';
  import ArrowUpRightIcon from '~icons/lucide/arrow-up-right';
  import { LitePlan } from '$assets/plan';
  import { isLiteOrHigher, isPlanUpgradeModalOpen, selectedPlan } from '$lib/svelte/stores/ui';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  type Props = {
    via: string;
    style?: SystemStyleObject | undefined;
    disabled?: boolean | undefined;
  };

  let { via, style = undefined, disabled = undefined }: Props = $props();
</script>

{#if disabled === undefined ? !$isLiteOrHigher : disabled}
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
      selectedPlan.set(LitePlan);
      isPlanUpgradeModalOpen.set(true);
    }}
    type="button"
  >
    <span>Lite</span>
    <Icon icon={ArrowUpRightIcon} size={12} />
  </button>
{/if}
