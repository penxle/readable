<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';
  import mixpanel from 'mixpanel-browser';
  import { onDestroy, untrack } from 'svelte';
  import { PlanId } from '@/const';
  import { graphql } from '$graphql';
  import {
    isEnrollPlanWithCardModalOpen,
    isLiteOrHigher,
    isPlanUpgradeModalOpen,
    isPro,
    selectedPlan,
    selectedPlanCycle,
  } from '$lib/svelte/stores/ui';
  import Header from './@header/Header.svelte';
  import EnrollPlanWithCardModal from './@modals/EnrollPlanWithCardModal.svelte';
  import PlanUpgradeModal from './@modals/PlanUpgradeModal.svelte';

  let { children } = $props();

  const query = graphql(`
    query TeamLayout_Query($teamId: ID!) {
      ...Header_query

      team(teamId: $teamId) {
        id
        plan {
          id
          plan {
            id
            name
          }
        }
      }
    }
  `);

  const teamUpdateStream = graphql(`
    subscription TeamLayout_TeamUpdateStream_Subscription($teamId: ID!) {
      teamUpdateStream(teamId: $teamId) {
        ... on Team {
          id
          name
          ...SiteSwitcher_team

          meAsMember {
            id
            role
          }

          members {
            id
            role
            isSoleAdmin
          }

          invitations {
            id
          }
        }

        ... on TeamMember {
          id
        }
      }
    }
  `);

  $effect(() => {
    isLiteOrHigher.set($query.team.plan.plan.id !== PlanId.STARTER);
    isPro.set($query.team.plan.plan.id === PlanId.PRO);
  });

  let unsubscribe: (() => void) | null = $state(null);

  $effect(() => {
    untrack(() => {
      unsubscribe?.();
    });

    unsubscribe = teamUpdateStream.subscribe({
      teamId: $query.team.id,
    });

    mixpanel.register({
      team_id: $query.team.id,
    });
  });

  onDestroy(() => {
    mixpanel.unregister('team_id');
    unsubscribe?.();
  });
</script>

<div class={flex({ flexDirection: 'column', height: 'screen' })}>
  <Header {$query} />

  {@render children()}
</div>

<PlanUpgradeModal
  confirm={(cycle) => {
    $isPlanUpgradeModalOpen = false;
    $isEnrollPlanWithCardModalOpen = true;
    $selectedPlanCycle = cycle;

    mixpanel.track('plan:upgrade:confirm');
  }}
  plan={$selectedPlan}
  planCycle={$selectedPlanCycle}
  bind:open={$isPlanUpgradeModalOpen}
/>

<EnrollPlanWithCardModal
  plan={$selectedPlan}
  planCycle={$selectedPlanCycle}
  teamId={$query.team.id}
  bind:open={$isEnrollPlanWithCardModalOpen}
/>
