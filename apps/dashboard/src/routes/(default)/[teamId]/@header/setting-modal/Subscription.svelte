<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, HorizontalDivider, Icon, Modal, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import dayjs from 'dayjs';
  import { z } from 'zod';
  import CheckIcon from '~icons/lucide/check';
  // import CreditCardIcon from '~icons/lucide/credit-card';

  let plansModal = $state(false);
  let cardModal = $state(false);
  let cardType: 'corporate' | 'personal' = $state('corporate');

  const plans = [
    {
      name: '무료',
      price: '₩0/월',
      features: ['기본 기능 무료 이용', '1인 사용자', '무제한 블럭', '월 5,000 페이지뷰'],
    },
    {
      name: '프로',
      price: '₩33,000/월',
      features: ['무제한 페이지뷰', '무제한 사용자', '무제한 사이트', 'AI 검색', '커스텀 도메인'],
    },
    {
      name: '엔터프라이즈',
      price: '맞춤형',
      features: ['모든 프로 기능', '데이터 셀프 호스팅', '전용 고객 지원', '맞춤형 기능'],
    },
  ];

  const {
    form: businessForm,
    isValid: businessFormIsValid,
    context: businessFormContext,
  } = createMutationForm({
    schema: z.object({
      birthOrBusinessRegistrationNumber: z.string().min(12),
      cardNumber: z.string().min(19),
      cardExpiry: z.string().min(5),
      passwordTwoDigits: z.string().min(2),
    }),
    mutation: async () => {
      // 카드 정보 제출 로직 구현
      alert('카드가 성공적으로 등록되었습니다.');
      cardModal = false;
    },
  });

  const {
    form: personalForm,
    isValid: personalFormIsValid,
    context: personalFormContext,
  } = createMutationForm({
    schema: z.object({
      birthOrBusinessRegistrationNumber: z.string().min(6),
      cardNumber: z.string().min(19),
      cardExpiry: z.string().min(5),
      passwordTwoDigits: z.string().min(2),
    }),
    mutation: async () => {
      // 카드 정보 제출 로직 구현
      alert('카드가 성공적으로 등록되었습니다.');
      cardModal = false;
    },
  });

  function toggleCardType() {
    cardType = cardType === 'corporate' ? 'personal' : 'corporate';
    agreementChecks = agreements.map(() => false);
  }

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

<h1 class={css({ textStyle: '28eb' })}>구독 및 결제</h1>

<HorizontalDivider style={css.raw({ marginTop: '20px', marginBottom: '40px' })} />

<div
  class={flex({
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  })}
>
  <h2 class={css({ textStyle: '18sb', color: 'text.primary' })}>현재 플랜</h2>
  <Button style={css.raw({ flexShrink: 0 })} size="md" variant="secondary" on:click={() => (plansModal = true)}>
    플랜 업그레이드
  </Button>
</div>

<div
  class={flex({
    padding: '24px',
    backgroundColor: 'surface.secondary',
    borderRadius: '16px',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: '1px',
    borderColor: 'border.primary',
  })}
>
  <div class={flex({ flexDirection: 'column', gap: '8px' })}>
    <span class={css({ textStyle: '20eb', color: 'text.primary' })}>무료 플랜</span>
    <span class={css({ textStyle: '14r', color: 'text.secondary' })}>기본 기능 무료 이용</span>
  </div>
  <div class={flex({ flexDirection: 'column', alignItems: 'flex-end', gap: '8px' })}>
    <span class={css({ textStyle: '24eb', color: 'text.primary' })}>₩0</span>
    <span class={css({ textStyle: '14r', color: 'text.secondary' })}>월</span>
  </div>
</div>

<HorizontalDivider style={css.raw({ marginTop: '20px', marginBottom: '40px' })} />

<h2 class={css({ textStyle: '18sb', color: 'text.primary', marginBottom: '16px' })}>플랜별 기능 비교</h2>

<table class={css({ width: 'full', borderCollapse: 'separate', borderSpacing: '0' })}>
  <thead>
    <tr>
      <th
        class={css({
          textAlign: 'left',
          padding: '12px',
          backgroundColor: 'surface.secondary',
          borderTopLeftRadius: '8px',
        })}
      >
        기능
      </th>
      <th class={css({ textAlign: 'center', padding: '12px', backgroundColor: 'surface.secondary' })}>무료</th>
      <th class={css({ textAlign: 'center', padding: '12px', backgroundColor: 'surface.secondary' })}>프로</th>
      <th
        class={css({
          textAlign: 'center',
          padding: '12px',
          backgroundColor: 'surface.secondary',
          borderTopRightRadius: '8px',
        })}
      >
        엔터프라이즈
      </th>
    </tr>
  </thead>
  <tbody>
    {#each [{ feature: '월간 페이지뷰', free: '5,000', pro: '무제한', enterprise: '무제한' }, { feature: '사용자 수', free: '1인', pro: '무제한', enterprise: '무제한' }, { feature: '사이트 수', free: '무제한', pro: '무제한', enterprise: '무제한' }, { feature: '블럭 수', free: '무제한', pro: '무제한', enterprise: '무제한' }, { feature: 'AI 검색', free: '✗', pro: '✓', enterprise: '✓' }, { feature: '커스텀 도메인', free: '✗', pro: '✓', enterprise: '✓' }, { feature: '데이터 셀프 호스팅', free: '✗', pro: '✗', enterprise: '✓' }, { feature: '전용 고객 지원', free: '✗', pro: '✗', enterprise: '✓' }, { feature: '맞춤형 기능', free: '✗', pro: '✗', enterprise: '✓' }, { feature: '가격', free: '무료', pro: '₩33,000/월', enterprise: '맞춤형' }] as row (row.feature)}
      <tr>
        <td
          class={css({
            padding: '12px',
            borderBottom: '1px solid',
            borderBottomColor: 'border.primary',
            textStyle: '14r',
            color: 'text.primary',
          })}
        >
          {row.feature}
        </td>
        <td
          class={css({
            padding: '12px',
            borderBottom: '1px solid',
            borderBottomColor: 'border.primary',
            textAlign: 'center',
            textStyle: '14r',
            color: 'text.secondary',
          })}
        >
          {row.free}
        </td>
        <td
          class={css({
            padding: '12px',
            borderBottom: '1px solid',
            borderBottomColor: 'border.primary',
            textAlign: 'center',
            textStyle: '14r',
            color: 'text.secondary',
          })}
        >
          {row.pro}
        </td>
        <td
          class={css({
            padding: '12px',
            borderBottom: '1px solid',
            borderBottomColor: 'border.primary',
            textAlign: 'center',
            textStyle: '14r',
            color: 'text.secondary',
          })}
        >
          {row.enterprise}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<!-- <div
  class={flex({
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  })}
>
  <h2 class={css({ textStyle: '18sb', color: 'text.primary' })}>결제 수단</h2>
  <Button style={css.raw({ flexShrink: 0 })} size="md" variant="secondary" on:click={() => (cardModal = true)}>
    카드 추가
  </Button>
</div> -->

<!-- <div
  class={flex({
    flexDirection: 'column',
    gap: '8px',
    padding: '24px',
    backgroundColor: 'surface.secondary',
    borderRadius: '16px',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: '1px',
    borderColor: 'border.primary',
    color: 'text.tertiary',
  })}
>
  <Icon icon={CreditCardIcon} size={28} />
  <span class={css({ textStyle: '16r' })}>등록된 카드 정보가 없습니다.</span>
</div> -->

<Modal style={css.raw({ width: '900px', padding: '32px' })} close={() => (plansModal = false)} open={plansModal}>
  <h2 class={css({ textStyle: '24eb', marginBottom: '24px' })}>플랜 선택</h2>

  <div class={flex({ flexDirection: 'row', gap: '16px', justifyContent: 'space-between' })}>
    {#each plans as plan (plan.name)}
      <div
        class={flex({
          flexDirection: 'column',
          height: '300px',
          padding: '24px',
          backgroundColor: 'surface.secondary',
          borderRadius: '16px',
          borderWidth: '1px',
          borderColor: 'border.primary',
          gap: '16px',
          flex: '1',
        })}
      >
        <div class={flex({ flexDirection: 'column', gap: '4px' })}>
          <span class={css({ textStyle: '20eb', color: 'text.secondary' })}>{plan.name}</span>
          <div class={flex({ alignItems: 'baseline', gap: '8px' })}>
            <span class={css({ textStyle: '24eb', color: 'text.primary' })}>{plan.price}</span>
            {#if plan.name !== 'Enterprise'}
              <span class={css({ textStyle: '12r', color: 'text.secondary' })}>VAT 포함</span>
            {/if}
          </div>
        </div>
        <ul class={css({ listStyleType: 'disc', paddingLeft: '20px' })}>
          {#each plan.features as feature (feature)}
            <li class={css({ textStyle: '14r', color: 'text.secondary' })}>{feature}</li>
          {/each}
        </ul>

        <div class={flex({ marginTop: 'auto', flexDirection: 'column' })}>
          {#if plan.name === '무료'}
            <Button disabled>현재 플랜</Button>
          {:else if plan.name === '엔터프라이즈'}
            <Button variant="secondary" on:click={() => alert('상담 요청이 전송되었습니다.')}>상담</Button>
          {:else}
            <Button on:click={() => (cardModal = true)}>시작</Button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</Modal>

<Modal style={css.raw({ width: '500px', padding: '32px' })} close={() => (cardModal = false)} open={cardModal}>
  <h2 class={css({ textStyle: '24eb', marginBottom: '24px' })}>결제 카드 추가</h2>

  <div class={flex({ flexDirection: 'column', gap: '24px' })}>
    <div class={flex({ gap: '4px', marginBottom: '8px' })}>
      <Button
        style={css.raw({ flex: '1' })}
        disabled={cardType === 'corporate'}
        variant="secondary"
        on:click={toggleCardType}
      >
        법인카드
        {#if cardType === 'corporate'}
          <Icon icon={CheckIcon} size={16} />
        {/if}
      </Button>
      <Button
        style={css.raw({ flex: '1' })}
        disabled={cardType === 'personal'}
        variant="secondary"
        on:click={toggleCardType}
      >
        개인카드 / 개인형 법인카드
        {#if cardType === 'personal'}
          <Icon icon={CheckIcon} size={16} />
        {/if}
      </Button>
    </div>

    {#if cardType === 'corporate'}
      <FormProvider
        class={flex({ flexDirection: 'column', gap: '8px' })}
        context={businessFormContext}
        form={businessForm}
      >
        <FormField name="birthOrBusinessRegistrationNumber" label="사업자등록번호">
          <TextInput
            inputmode="numeric"
            maxlength={12}
            pattern="[0-9]{3}-[0-9]{2}-[0-9]{5}"
            placeholder="000-00-00000"
            required
            on:input={formatBusinessNumber}
          />
        </FormField>
        <FormField name="cardNumber" label="카드 번호">
          <TextInput
            inputmode="numeric"
            maxlength={19}
            pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
            placeholder="0000-0000-0000-0000"
            required
            on:input={formatCardNumber}
          />
        </FormField>
        <div class={flex({ gap: '16px' })}>
          <FormField name="cardExpiry" label="유효 기간 (MM/YY)">
            <TextInput
              inputmode="numeric"
              maxlength={5}
              pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
              placeholder="MM/YY"
              required
              on:input={formatCardExpiry}
            />
          </FormField>
          <FormField name="passwordTwoDigits" label="비밀번호 앞 두자리">
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

        <div
          class={flex({
            padding: '16px',
            backgroundColor: 'surface.secondary',
            borderRadius: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: '1px',
            borderColor: 'border.primary',
            marginBottom: '20px',
          })}
        >
          <div class={flex({ flexDirection: 'column', gap: '4px' })}>
            <span class={css({ textStyle: '14r', color: 'text.secondary' })}>다음 결제일</span>
            <span class={css({ textStyle: '16sb', color: 'text.primary' })}>
              {dayjs.kst().format('YYYY년 MM월 DD일')}
            </span>
          </div>
          <div class={flex({ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' })}>
            <span class={css({ textStyle: '14r', color: 'text.secondary' })}>결제 금액</span>
            <span class={css({ textStyle: '18eb', color: 'text.primary' })}>₩33,000</span>
          </div>
        </div>

        <div class={flex({ flexDirection: 'column', gap: '12px' })}>
          <label class={flex({ alignItems: 'center', gap: '8px' })}>
            <input checked={allChecked} onchange={handleAllCheck} type="checkbox" />
            <span class={css({ textStyle: '16sb', color: 'text.primary' })}>모두 확인하고 동의합니다.</span>
          </label>

          <div class={css({ paddingLeft: '12px' })}>
            {#each agreements as agreement (agreement.name)}
              <label class={flex({ alignItems: 'center', gap: '8px', marginBottom: '8px' })}>
                <input type="checkbox" bind:checked={agreementChecks[agreements.indexOf(agreement)]} />
                <span class={css({ textStyle: '14r', color: 'text.secondary' })}>
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
              </label>
            {/each}
          </div>
        </div>

        <Button disabled={!allChecked || !$businessFormIsValid} type="submit">카드 추가하기</Button>
      </FormProvider>
    {:else}
      <FormProvider
        class={flex({ flexDirection: 'column', gap: '8px' })}
        context={personalFormContext}
        form={personalForm}
      >
        <FormField name="birthOrBusinessRegistrationNumber" label="생년월일">
          <TextInput inputmode="numeric" maxlength={6} pattern="[0-9]{6}" placeholder="990101" required />
        </FormField>
        <FormField name="cardNumber" label="카드 번호">
          <TextInput
            inputmode="numeric"
            maxlength={19}
            pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
            placeholder="0000-0000-0000-0000"
            required
            on:input={formatCardNumber}
          />
        </FormField>
        <div class={flex({ gap: '16px' })}>
          <FormField name="cardExpiry" label="유효 기간 (MM/YY)">
            <TextInput
              inputmode="numeric"
              maxlength={5}
              pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
              placeholder="MM/YY"
              required
              on:input={formatCardExpiry}
            />
          </FormField>
          <FormField name="passwordTwoDigits" label="비밀번호 앞 두자리">
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

        <div
          class={flex({
            padding: '16px',
            backgroundColor: 'surface.secondary',
            borderRadius: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: '1px',
            borderColor: 'border.primary',
            marginBottom: '20px',
          })}
        >
          <div class={flex({ flexDirection: 'column', gap: '4px' })}>
            <span class={css({ textStyle: '14r', color: 'text.secondary' })}>다음 결제일</span>
            <span class={css({ textStyle: '16sb', color: 'text.primary' })}>
              {dayjs.kst().format('YYYY년 MM월 DD일')}
            </span>
          </div>
          <div class={flex({ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' })}>
            <span class={css({ textStyle: '14r', color: 'text.secondary' })}>결제 금액</span>
            <span class={css({ textStyle: '18eb', color: 'text.primary' })}>₩33,000</span>
          </div>
        </div>

        <div class={flex({ flexDirection: 'column', gap: '12px' })}>
          <label class={flex({ alignItems: 'center', gap: '8px' })}>
            <input checked={allChecked} onchange={handleAllCheck} type="checkbox" />
            <span class={css({ textStyle: '16sb', color: 'text.primary' })}>모두 확인하고 동의합니다.</span>
          </label>

          <div class={css({ paddingLeft: '12px' })}>
            {#each agreements as agreement (agreement.name)}
              <label class={flex({ alignItems: 'center', gap: '8px', marginBottom: '8px' })}>
                <input type="checkbox" bind:checked={agreementChecks[agreements.indexOf(agreement)]} />
                <span class={css({ textStyle: '14r', color: 'text.secondary' })}>
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
              </label>
            {/each}
          </div>
        </div>

        <Button disabled={!allChecked || !$personalFormIsValid} type="submit">등록하기</Button>
      </FormProvider>
    {/if}
  </div>
</Modal>
