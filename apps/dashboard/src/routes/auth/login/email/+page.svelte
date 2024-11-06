<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Icon, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import MailIcon from '~icons/lucide/mail';
  import IconGithub from '~icons/simple-icons/github';
  import { page } from '$app/stores';
  import FullLogo from '$assets/logos/full.svg?component';
  import { graphql } from '$graphql';

  const { form, context, setInitialValues } = createMutationForm({
    schema: z.object({
      email: dataSchemas.email,
    }),
    mutation: graphql(`
      mutation LoginPage_SendAuthorizationEmail_Mutation($input: SendAuthorizationEmailInput!) {
        sendAuthorizationEmail(input: $input)
      }
    `),
    onSuccess: () => {
      mixpanel.track('user:login:start', {
        provider: 'EMAIL',
      });

      sent = true;
    },
    onError: (error) => {
      console.log(error);
    },
  });

  setInitialValues({
    email: $page.url.searchParams.get('email') ?? '',
  });

  let sent = $state(false);
</script>

<div
  class={flex({
    direction: 'column',
    align: 'center',
    justify: 'center',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    width: 'full',
    maxWidth: '576px',
    minHeight: 'screen',
  })}
>
  {#if sent}
    <Icon icon={MailIcon} size={32} />
    <p class={css({ marginTop: '12px', textStyle: '15m', color: 'text.secondary' })}>
      인증 메일을 보냈습니다.
      <br />
      메일함을 확인해 주세요.
    </p>
    <button
      class={css({ textStyle: '14r', color: 'neutral.70', marginTop: '16px' })}
      onclick={() => (sent = false)}
      type="button"
    >
      돌아가기
    </button>
  {:else}
    <FullLogo class={css({ marginBottom: '20px', color: 'text.accent', height: '30px' })} />

    <p class={css({ marginBottom: '32px', textStyle: '15m', color: 'text.secondary' })}>
      제품과 문서를 동기화하고
      <br />
      신뢰할 수 있는 가이드 문서를 만들어 보세요
    </p>

    <FormProvider {context} {form}>
      <div class={flex({ direction: 'column', gap: '4px', width: '320px' })}>
        <FormField name="email" label="이메일">
          <TextInput name="email" placeholder="me@example.com" />
        </FormField>

        <Button style={flex.raw({ gap: '6px', width: 'full' })} size="lg" type="submit">인증 메일 보내기</Button>
      </div>
    </FormProvider>
  {/if}
</div>

<footer class={css({ backgroundColor: 'neutral.0', width: 'full' })}>
  <div
    class={flex({
      marginX: 'auto',
      maxWidth: '1200px',
      direction: 'column',
      gap: '40px',
      paddingX: { base: '24px', md: '48px' },
      paddingY: '48px',
      width: 'full',
    })}
  >
    <div class={flex({ align: 'center', justify: 'space-between' })}>
      <FullLogo class={css({ height: { base: '20px', md: '24px' } })} />

      <a aria-label="GitHub" href="https://github.com/penxle" rel="noopener noreferrer" target="_blank">
        <Icon style={css.raw({ color: '[#181717]', hideFrom: 'md' })} icon={IconGithub} size={20} />
        <Icon style={css.raw({ color: '[#181717]', hideBelow: 'md' })} icon={IconGithub} size={24} />
      </a>
    </div>

    <div class={flex({ textStyle: { base: '12r', md: '14r' }, color: 'neutral.70', direction: 'column', gap: '4px' })}>
      <p>주식회사 펜슬컴퍼니 | 대표 배준현 | 서울특별시 강남구 강남대로100길 14, 6층</p>

      <p>
        사업자등록번호 610-88-03078 | <a
          href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=6108803078"
          rel="noopener noreferrer"
          target="_blank"
        >
          통신판매업신고 2023-서울강남-4541
        </a>
      </p>

      <p>02-565-7695 | hello@penxle.io</p>
    </div>

    <div class={css({ height: '20px' })}></div>
  </div>
</footer>
