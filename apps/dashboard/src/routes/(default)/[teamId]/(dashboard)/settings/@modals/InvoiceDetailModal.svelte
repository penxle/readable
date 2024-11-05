<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon, VerticalDivider } from '@readable/ui/components';
  import dayjs from 'dayjs';
  import ExternalLinkIcon from '~icons/lucide/external-link';
  import InfoIcon from '~icons/lucide/info';
  import { fragment, graphql } from '$graphql';
  import { TitledModal } from '$lib/components';
  import type { InvoiceDetailModal_paymentInvoice } from '$graphql';

  type Props = {
    $paymentInvoice: InvoiceDetailModal_paymentInvoice;
    open?: boolean;
  };

  let { $paymentInvoice: _paymentInvoice, open = $bindable(false) }: Props = $props();

  let paymentInvoice = fragment(
    _paymentInvoice,
    graphql(`
      fragment InvoiceDetailModal_paymentInvoice on PaymentInvoice {
        id
        amount
        state
        createdAt

        items {
          id
          name
          amount
          quantity
          type
        }

        records {
          id
          amount
          createdAt
          receiptUrl
          type

          paymentMethod {
            id
            name
          }
        }
      }
    `),
  );
</script>

<TitledModal bind:open>
  {#snippet title()}
    청구서
  {/snippet}

  <div class={flex({ direction: 'column', gap: '24px' })}>
    <div class={css({ borderRadius: '8px', padding: '12px', textStyle: '14m', backgroundColor: 'neutral.10' })}>
      주문번호: {$paymentInvoice.id}
    </div>

    <div>
      <div
        class={flex({
          align: 'center',
          justify: 'space-between',
          borderBottomWidth: '1px',
          borderColor: 'border.primary',
          paddingX: '12px',
          paddingY: '14px',
        })}
      >
        <div class={css({ textStyle: '15b', color: 'text.secondary' })}>청구 총액</div>
        <div class={css({ fontWeight: '[800]' })}>{$paymentInvoice.amount.toLocaleString()}원</div>
      </div>

      {#each $paymentInvoice.items as item (item.id)}
        {#if item.type === 'PLAN'}
          <div
            class={flex({
              align: 'center',
              justify: 'space-between',
              borderBottomWidth: '1px',
              borderColor: 'border.primary',
              paddingX: '12px',
              paddingY: '14px',
              color: 'text.tertiary',
            })}
          >
            <div class={css({ textStyle: '14r' })}>{item.name} 플랜</div>
            <div class={css({ textStyle: '14sb' })}>{item.amount.toLocaleString()}원</div>
          </div>
        {/if}
      {/each}

      <!-- <div
        class={flex({
          align: 'center',
          borderBottomWidth: '1px',
          borderColor: 'border.primary',
          paddingX: '12px',
          paddingY: '14px',
          color: 'text.tertiary',
        })}
      >
        <div class={css({ textStyle: '14r', width: '152px' })}>화이트 라벨링</div>
        <div class={css({ textStyle: '14r' })}>1000x사이트 2</div>
        <div class={css({ marginLeft: 'auto', textStyle: '14sb' })}>100,000원</div>
      </div>
      <div
        class={flex({
          align: 'center',
          justify: 'space-between',
          borderBottomWidth: '1px',
          borderColor: 'border.primary',
          paddingX: '12px',
          paddingY: '14px',
          color: 'text.tertiary',
        })}
      >
        <div class={css({ textStyle: '14r' })}>부가세</div>
        <div class={css({ textStyle: '14sb' })}>1000원</div>
      </div> -->
    </div>

    <div>
      <div
        class={flex({
          align: 'center',
          justify: 'space-between',
          borderBottomWidth: '1px',
          borderColor: 'border.primary',
          paddingX: '12px',
          paddingY: '14px',
          textStyle: '15b',
          color: 'text.secondary',
        })}
      >
        결제 정보
      </div>

      {#each $paymentInvoice.records as record (record.id)}
        <div
          class={flex({
            align: 'center',
            borderBottomWidth: '1px',
            borderColor: 'border.primary',
            paddingX: '12px',
            paddingY: '14px',
            color: 'text.tertiary',
          })}
        >
          <div class={css({ textStyle: '14r', width: '152px' })}>{dayjs(record.createdAt).formatAsDateTime()}</div>
          <div class={css({ textStyle: '14r' })}>{record.paymentMethod.name}</div>
          <div class={flex({ align: 'center', gap: '8px', marginLeft: 'auto', textStyle: '14sb' })}>
            {#if record.type === 'SUCCESS'}
              <div
                class={css({
                  borderWidth: '1px',
                  borderColor: '[#EBFAF1]',
                  borderRadius: '4px',
                  paddingX: '4px',
                  paddingY: '2px',
                  textStyle: '12b',
                  color: '[#308959]',
                  backgroundColor: '[#EBFAF1]',
                })}
              >
                결제 성공
              </div>

              <VerticalDivider style={css.raw({ width: '1px', height: '12px' })} color="secondary" />

              <a
                class={flex({
                  align: 'center',
                  gap: '4px',
                  borderWidth: '1px',
                  borderColor: 'border.secondary',
                  borderRadius: '4px',
                  paddingX: '4px',
                  paddingY: '2px',
                  textStyle: '12b',
                  color: 'text.tertiary',
                })}
                href={record.receiptUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>영수증</span>
                <Icon style={css.raw({ color: 'gray.500' })} icon={ExternalLinkIcon} size={12} />
              </a>
            {:else}
              <div
                class={flex({
                  align: 'center',
                  gap: '4px',
                  borderWidth: '1px',
                  borderColor: 'danger.10',
                  borderRadius: '4px',
                  paddingX: '4px',
                  paddingY: '2px',
                  textStyle: '12b',
                  color: 'text.danger',
                  backgroundColor: 'danger.10',
                })}
              >
                <span>결제 실패</span>
                <Icon icon={InfoIcon} size={12} />
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</TitledModal>
