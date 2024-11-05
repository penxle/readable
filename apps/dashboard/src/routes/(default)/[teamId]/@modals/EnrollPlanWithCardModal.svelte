<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, Checkbox, FormField, FormProvider, HorizontalDivider, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import { calculatePaymentAmount } from '@readable/ui/utils';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import { graphql } from '$graphql';
  import { TitledModal } from '$lib/components';
  import type { BillingCycle } from '@/enums';

  type Props = {
    open?: boolean;
    teamId: string;
    plan: { id: string; name: string; price: number };
    planCycle?: BillingCycle;
  };

  let { open = $bindable(false), teamId, plan, planCycle = 'MONTHLY' }: Props = $props();

  const updateCard = graphql(`
    mutation EnrollPlanWithCardModal_UpdatePaymentMethod_Mutation($input: UpdatePaymentMethodInput!) {
      updatePaymentMethod(input: $input) {
        id
        name
      }
    }
  `);

  const enrollTeamPlan = graphql(`
    mutation EnrollPlanWithCardModal_EnrollTeamPlan_Mutation($input: EnrollTeamPlanInput!) {
      enrollTeamPlan(input: $input) {
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

  const { form, isValid, context, data } = createMutationForm({
    mutation: updateCard,
    schema: z.object({
      teamId: dataSchemas.team.id,
      birthOrBusinessRegistrationNumber: z.string().min(6),
      cardNumber: z.string().min(19),
      expiry: z.string().min(5),
      passwordTwoDigits: z.string().min(2),
    }),
    onSuccess: async () => {
      mixpanel.track('billing:add-method:success');
      mixpanel.track('plan:enroll:start', {
        billingCycle: planCycle,
      });

      enrollTeamPlan({
        teamId,
        planId: plan.id,
        billingCycle: planCycle,
      })
        .then(() => {
          toast.success('플랜이 변경되었습니다');
          open = false;
          mixpanel.track('plan:enroll:success', {
            billingCycle: planCycle,
          });
        })
        .catch(() => {
          // TODO: 에러 메시지 구별
          toast.error('플랜 변경에 실패했습니다');
          mixpanel.track('plan:enroll:fail');
        });
    },
    onError: () => {
      // TODO: 에러 메시지 구별
      toast.error('카드 추가에 실패했습니다');
      mixpanel.track('billing:add-method:fail');
    },
  });

  let maybeBusinessRegistrationNumber = $derived($data.birthOrBusinessRegistrationNumber?.length > 6);

  function formatBusinessNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replaceAll(/\D/g, '');
    const parts = [value.slice(0, 3), value.slice(3, 5), value.slice(5)];
    input.value = parts.filter(Boolean).join('-');
  }

  function formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replaceAll(/\D/g, '');
    const parts = [value.slice(0, 4), value.slice(4, 8), value.slice(8, 12), value.slice(12)];
    input.value = parts.filter(Boolean).join('-');
  }

  function formatCardExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replaceAll(/\D/g, '');
    input.value = value.length > 2 ? value.slice(0, 2) + '/' + value.slice(2, 4) : value;
  }

  const agreements = [
    { name: '리더블 결제서비스 이용약관', url: 'https://docs.rdbl.io/legal/payment' },
    { name: 'NICEPAY 전자금융거래 기본약관', url: 'https://www.nicepay.co.kr/cs/terms/policy1.do' },
  ];

  let agreementChecks = $state(agreements.map(() => false));
  let allChecked = $derived(agreementChecks.every(Boolean));
  function handleAllCheck() {
    agreementChecks = agreementChecks.map(() => !allChecked);
  }
</script>

<TitledModal bind:open>
  {#snippet title()}
    카드 추가 및 결제
  {/snippet}

  <div
    class={flex({
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingX: '16px',
      paddingY: '12px',
      textStyle: '18b',
      backgroundColor: 'neutral.10',
      borderRadius: '8px',
    })}
  >
    <div>{plan.name} 플랜</div>
    <div>{calculatePaymentAmount({ fee: plan.price, billingCycle: planCycle }).final.toLocaleString()}원</div>
  </div>

  <FormProvider class={flex({ marginTop: '24px', flexDirection: 'column' })} {context} {form}>
    <div class={flex({ flexDirection: 'column', gap: '20px' })}>
      <input name="teamId" type="hidden" value={teamId} />
      <FormField name="cardNumber" label="카드 번호" noMessage>
        <TextInput
          inputmode="numeric"
          maxlength={19}
          pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
          placeholder="0000-0000-0000-0000"
          required
          on:input={formatCardNumber}
        />
      </FormField>
      <div class={flex({ width: 'full', gap: '16px' })}>
        <FormField name="expiry" style={css.raw({ flex: '1' })} label="유효 기간 (MM/YY)" noMessage>
          <TextInput
            inputmode="numeric"
            maxlength={5}
            pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
            placeholder="MM/YY"
            required
            on:input={formatCardExpiry}
          />
        </FormField>
        <FormField name="passwordTwoDigits" style={css.raw({ flex: '1' })} label="비밀번호 앞 두자리" noMessage>
          <TextInput
            autocomplete="off"
            inputmode="numeric"
            maxlength={2}
            pattern="[0-9]{2}"
            placeholder="**"
            required
            type="password"
          />
        </FormField>
      </div>
      <FormField
        name="birthOrBusinessRegistrationNumber"
        description="법인명과 개인이름이 함께 표시된 경우, 개인의 생년월일을 입력해주세요"
        label="생년월일 6자리(개인) / 사업자등록번호 10자리(법인)"
        noMessage
      >
        <TextInput
          inputmode="numeric"
          maxlength={12}
          pattern={maybeBusinessRegistrationNumber ? '[0-9]{3}-[0-9]{2}-[0-9]{5}' : '[0-9]{6}'}
          placeholder=""
          required
          on:input={maybeBusinessRegistrationNumber ? formatBusinessNumber : undefined}
        />
      </FormField>
    </div>

    <div class={flex({ marginTop: '60px', flexDirection: 'column', gap: '8px' })}>
      <Checkbox checked={allChecked} size="md" variant="brand" on:change={handleAllCheck}>
        <span class={css({ textStyle: '16sb', color: 'text.secondary' })}>모두 확인하고 동의합니다.</span>
      </Checkbox>

      <HorizontalDivider />

      {#each agreements as agreement (agreement.name)}
        <!-- <label class={flex({ alignItems: 'center', gap: '8px', marginBottom: '8px' })}> -->
        <Checkbox size="md" variant="brand" bind:checked={agreementChecks[agreements.indexOf(agreement)]}>
          <span class={css({ textStyle: '14r', color: 'text.tertiary' })}>
            (필수) <a
              class={css({ textDecoration: 'underline' })}
              href={agreement.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {agreement.name}
            </a>
            동의
          </span>
        </Checkbox>
        <!-- </label> -->
      {/each}
    </div>

    <div class={css({ marginTop: '60px' })}>
      <Button style={css.raw({ width: 'full' })} disabled={!allChecked || !$isValid} type="submit">결제</Button>
    </div>
  </FormProvider>
</TitledModal>
