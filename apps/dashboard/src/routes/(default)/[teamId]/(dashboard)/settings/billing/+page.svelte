<script lang="ts">
  import { css, cva } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, Helmet, HorizontalDivider, Icon } from '@readable/ui/components';
  import dayjs from 'dayjs';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import { goto } from '$app/navigation';
  import { graphql } from '$graphql';
  import InvoiceDetailModal from '../@modals/InvoiceDetailModal.svelte';
  import UpdateBillingEmailModal from '../@modals/UpdateBillingEmailModal.svelte';
  import UpdateCardModal from '../@modals/UpdateCardModal.svelte';

  let query = $derived(
    graphql(`
      query TeamSettingsBillingPage_Query($teamId: ID!) {
        team(teamId: $teamId) {
          id
          name

          plan {
            id
            amount
            billingCycle
            billingEmail
            enrolledAt
            nextPaymentAt

            plan {
              id
              name
            }
          }

          paymentInvoices {
            id
            amount
            state
            createdAt
            ...InvoiceDetailModal_paymentInvoice
          }

          paymentMethod {
            id
            name
          }
        }
      }
    `),
  );

  const invoiceStateStyle = cva({
    base: {
      display: 'inline-block',
      verticalAlign: 'text-top',
      textStyle: '12b',
      paddingX: '4px',
      paddingY: '2px',
      borderRadius: '4px',
    },
    variants: {
      state: {
        FAILED: { backgroundColor: 'danger.60', color: 'white' },
        PENDING: { backgroundColor: 'danger.10', color: 'text.danger' },
        COMPLETED: { backgroundColor: '[#EBFAF1]', color: '[#308959]' },
      },
    },
  });

  const getInvoiceStateText = (state: string) => {
    switch (state) {
      case 'FAILED':
        return '결제 실패';
      case 'PENDING':
        return '미결제';
      case 'COMPLETED':
        return '결제 완료';
      default:
        return state;
    }
  };

  let isUpdateCardModalOpen = $state(false);
  let isUpdateBillingEmailModalOpen = $state(false);
  let isInvoiceDetailModalOpen = $state(false);

  let paymentInvoice: (typeof $query.team.paymentInvoices)[number] = $state();
</script>

<Helmet title="결제 및 청구" trailing={$query.team.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>결제 및 청구</h1>

<div class={flex({ flexDirection: 'column', gap: '8px' })}>
  <div
    class={css({
      borderWidth: '1px',
      borderColor: 'border.primary',
      borderRadius: '10px',
      padding: '32px',
      backgroundColor: 'surface.primary',
    })}
  >
    <div class={flex({ flexDirection: 'column', gap: '8px' })}>
      <div class={css({ textStyle: '14sb', color: 'text.secondary' })}>현재 이용중인 플랜</div>
      <div class={flex({ justifyContent: 'space-between', alignItems: 'center' })}>
        <div class={css({ textStyle: '20b' })}>
          {$query.team.plan.plan.name}
        </div>
        <Button
          size="md"
          variant={$query.team.plan.plan.name === 'Basic' ? 'primary' : 'secondary'}
          on:click={() => goto(`/${$query.team.id}/settings/plan`)}
        >
          플랜 변경
        </Button>
      </div>

      {#if $query.team.plan.amount > 0}
        <HorizontalDivider />
        <div class={flex({ flexDirection: 'column', gap: '12px' })}>
          <div class={css({ textStyle: '13r', color: 'text.tertiary' })}>
            {dayjs($query.team.plan.nextPaymentAt).format('YYYY년 MM월 DD일')}에 {$query.team.plan.amount.toLocaleString()}원이
            결제될 예정입니다
          </div>
          <!-- <dl
            class={flex({
              alignSelf: 'flex-start',
              flexDirection: 'column',
              gap: '8px',
              borderRadius: '8px',
              minWidth: '254px',
              width: 'auto',
              padding: '16px',
              backgroundColor: 'neutral.10',
            })}
          >
            <div class={flex({ justifyContent: 'space-between', textStyle: '13m', color: 'text.tertiary' })}>
              <dt>Pro 플랜</dt>
              <dd>12,000원</dd>
            </div>
            <div class={flex({ justifyContent: 'space-between', textStyle: '13m', color: 'text.tertiary' })}>
              <dt>화이트 라벨링</dt>
              <dd>12,000원</dd>
            </div>
            <div class={flex({ justifyContent: 'space-between', textStyle: '13sb', color: 'text.tertiary' })}>
              <dt>총액</dt>
              <dd>24,000원</dd>
            </div>
          </dl> -->
        </div>
      {/if}
    </div>
  </div>

  {#if $query.team.paymentMethod}
    <div
      class={css({
        borderWidth: '1px',
        borderColor: 'border.primary',
        borderRadius: '10px',
        padding: '32px',
        backgroundColor: 'surface.primary',
      })}
    >
      <div class={flex({ flexDirection: 'column', gap: '40px' })}>
        <div class={flex({ flexDirection: 'column', gap: '8px' })}>
          <div class={css({ textStyle: '14sb', color: 'text.secondary' })}>결제 정보</div>
          <div class={flex({ justifyContent: 'space-between', alignItems: 'center' })}>
            <div class={css({ textStyle: '16m' })}>{$query.team.paymentMethod.name}</div>
            <Button size="md" variant="secondary" on:click={() => (isUpdateCardModalOpen = true)}>카드 변경</Button>
          </div>
        </div>
        <HorizontalDivider />
        <div class={flex({ flexDirection: 'column', gap: '8px' })}>
          <div class={css({ textStyle: '14sb', color: 'text.secondary', marginBottom: '4px' })}>청구서 수신 이메일</div>
          <div class={flex({ justifyContent: 'space-between', alignItems: 'center' })}>
            <div class={css({ textStyle: '16m' })}>{$query.team.plan.billingEmail}</div>
            <Button size="md" variant="secondary" on:click={() => (isUpdateBillingEmailModalOpen = true)}>
              이메일 변경
            </Button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if $query.team.paymentInvoices.length > 0}
    <div
      class={css({
        borderWidth: '1px',
        borderColor: 'border.primary',
        borderRadius: '10px',
        padding: '32px',
        backgroundColor: 'surface.primary',
      })}
    >
      <div class={flex({ flexDirection: 'column', gap: '16px' })}>
        <div class={css({ textStyle: '14sb', color: 'text.secondary' })}>청구 내역</div>
        <table class={css({ width: 'full', borderCollapse: 'collapse', borderSpacingX: '10px' })}>
          <thead>
            <tr
              class={css({
                textStyle: '13sb',
                color: 'text.tertiary',
                textAlign: 'left',
                '& th': {
                  borderTopWidth: '1px',
                  borderBottomWidth: '1px',
                  borderColor: 'divider.primary',
                },
              })}
            >
              <th class={css({ paddingLeft: '14px', paddingY: '12px' })}>청구일</th>
              <th class={css({ paddingY: '12px' })}>상태</th>
              <th class={css({ paddingY: '12px', textAlign: 'right', paddingRight: '38px' })}>청구 총액</th>
            </tr>
          </thead>
          <tbody>
            {#each $query.team.paymentInvoices as invoice (invoice.id)}
              <tr
                class={css({
                  backgroundColor: 'white',
                  _hover: { backgroundColor: 'neutral.10' },
                  cursor: 'pointer',
                  '& td': {
                    borderTopWidth: '1px',
                    borderBottomWidth: '1px',
                    borderColor: 'divider.primary',
                    verticalAlign: 'middle',
                  },
                })}
                onclick={() => {
                  paymentInvoice = invoice;
                  isInvoiceDetailModalOpen = true;
                }}
                role="button"
              >
                <td class={css({ paddingY: '14px', paddingLeft: '16px', textStyle: '14r' })}>
                  {dayjs(invoice.createdAt).formatAsDate()}
                </td>
                <td>
                  <div class={invoiceStateStyle({ state: invoice.state })}>
                    {getInvoiceStateText(invoice.state)}
                  </div>
                </td>
                <td class={css({ textStyle: '14r', textAlign: 'right', paddingRight: '8px' })}>
                  <div
                    class={flex({ alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginLeft: 'auto' })}
                  >
                    {invoice.amount.toLocaleString()}원
                    <div class={css({ color: 'gray.500', padding: '4px' })}>
                      <Icon icon={ChevronRightIcon} size={16} />
                    </div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<UpdateCardModal teamId={$query.team.id} bind:open={isUpdateCardModalOpen} />
<UpdateBillingEmailModal teamId={$query.team.id} bind:open={isUpdateBillingEmailModalOpen} />
{#if paymentInvoice}
  <InvoiceDetailModal $paymentInvoice={paymentInvoice} bind:open={isInvoiceDetailModalOpen} />
{/if}
