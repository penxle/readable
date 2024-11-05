<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button } from '@readable/ui/components';
  import { calculateDetailedAmount, calculatePaymentAmount } from '@readable/ui/utils';
  import { TitledModal } from '$lib/components';
  import PlanCycleToggle from './PlanCycleToggle.svelte';
  import type { BillingCycle } from '@/enums';

  type Props = {
    open?: boolean;
    confirm: (cycle: BillingCycle) => void;
    plan: { id: string; name: string; price: number };
    planCycle?: BillingCycle;
  };

  let { open = $bindable(false), confirm, plan, planCycle = $bindable('MONTHLY') }: Props = $props();

  const finalPaymentAmount = $derived(
    calculateDetailedAmount(calculatePaymentAmount({ fee: plan.price, billingCycle: planCycle }).final),
  );
</script>

<TitledModal bind:open>
  {#snippet title()}
    {plan.name} 플랜으로 업그레이드
  {/snippet}

  <div class={flex({ flexDirection: 'column', gap: '20px' })}>
    <p class={css({ textStyle: '14r', color: 'text.tertiary' })}>
      {plan.name} 플랜으로 업그레이드하면 모든 기능을 이용할 수 있습니다.
    </p>
    <PlanCycleToggle defaultValue={planCycle} onselect={(cycle) => (planCycle = cycle)} />
    <table
      class={css({
        width: 'full',
        '& tr': { height: '50px' },
        '& td, & th': { borderBottomWidth: '1px', borderColor: 'divider.primary', paddingX: '12px' },
      })}
    >
      <tbody>
        <tr>
          <th class={css({ textAlign: 'left', color: 'text.primary', textStyle: '15b' })}>예상 요금</th>
          <td class={css({ textAlign: 'right', color: 'text.primary', textStyle: '16eb' })}>
            {finalPaymentAmount.total.toLocaleString()}원
          </td>
        </tr>
        <tr>
          <th class={css({ textAlign: 'left', color: 'text.secondary', textStyle: '14r' })}>
            {plan.name} 플랜
          </th>
          <td class={css({ textAlign: 'right', color: 'text.primary', textStyle: '14sb' })}>
            {finalPaymentAmount.supply.toLocaleString()}원
          </td>
        </tr>
        <tr>
          <th class={css({ textAlign: 'left', color: 'text.secondary', textStyle: '14r' })}>부가가치세</th>
          <td class={css({ textAlign: 'right', color: 'text.primary', textStyle: '14sb' })}>
            {finalPaymentAmount.vat.toLocaleString()}원
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <Button style={css.raw({ width: 'full', marginTop: '40px' })} glossy onclick={() => confirm(planCycle)} size="lg">
    확인 및 결제
  </Button>
</TitledModal>
