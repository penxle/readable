<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Helmet, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import { goto } from '$app/navigation';
  import HeroLight from '$assets/hero/light.svg?component';
  import { supabase } from '$lib/supabase';
  import Header from '../Header.svelte';

  let darkSection = $state<HTMLElement>();

  const { form, context } = createMutationForm({
    schema: z.object({
      name: dataSchemas.user.name,
      email: dataSchemas.email,
      phoneNumber: z.string().nullish(),
      companyName: z.string().nullish(),
      content: z.string().nullish(),
    }),
    mutation: async (data) => {
      const { error } = await supabase.from('contacts').insert([
        {
          name: data.name,
          email: data.email,
          phone_number: data.phoneNumber,
          company_name: data.companyName,
          content: data.content,
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await goto('/complete');
    },
  });

  const darkSections = $derived([darkSection].filter((section) => !!section));
</script>

<Helmet
  description="팀 문서화의 고민, 리더블 전문가와 함께 해결하세요. 기존 문서 이전부터 최적의 활용 방법까지, 궁금한 점이 있으시다면 언제든 물어보세요"
  image={{ src: 'https://cdn.rdbl.app/opengraph/cover.png', size: 'large' }}
  title="도입 문의"
  trailing="리더블"
/>

<HeroLight
  class={css({
    position: 'absolute',
    top: '-121px',
    left: '0',
    right: '0',
    marginX: 'auto',
    zIndex: '50',
    width: '1280px',
    height: '360px',
    lgDown: {
      width: 'full',
      height: '300px',
    },
  })}
/>

<Header {darkSections} theme="dark" />

<div
  bind:this={darkSection}
  class={flex({
    direction: 'column',
    paddingTop: { base: '128px', lg: '168px' },
    paddingBottom: { base: '80px', lg: '124px' },
    backgroundColor: 'neutral.100',
    color: 'white',
  })}
>
  <div class={css({ marginX: 'auto', paddingX: '20px', width: 'full', maxWidth: '726px' })}>
    <h1
      class={css({
        marginBottom: { base: '10px', lg: '16px' },
        fontSize: { base: '24px', lg: '[45px]' },
        fontWeight: '[800]',
        textAlign: 'center',
      })}
    >
      도입 문의
    </h1>

    <p class={css({ textStyle: { base: '14m', lg: '22m' }, textAlign: 'center' })}>
      팀 문서화의 고민, 리더블 전문가와 함께 해결하세요.
      <br />
      기존 문서 이전부터 최적의 활용 방법까지,
      <br />
      궁금한 점이 있으시다면 언제든 물어보세요.
    </p>
  </div>
</div>

<div class={css({ background: '[linear-gradient(180deg, #FFF 0%, #FAFAFA 74.47%)]' })}>
  <div class={css({ marginX: 'auto', paddingX: '20px', paddingBottom: '120px', width: 'full', maxWidth: '590px' })}>
    <FormProvider
      class={flex({ direction: 'column', gap: '16px', marginTop: { base: '60px', lg: '80px' } })}
      {context}
      {form}
    >
      <FormField name="name" label="성함 *">
        <TextInput placeholder="홍길동" />
      </FormField>
      <FormField name="email" label="이메일 *">
        <TextInput placeholder="me@example.com" />
      </FormField>
      <FormField name="phoneNumber" label="전화번호">
        <TextInput placeholder="010-0000-0000" />
      </FormField>
      <FormField name="companyName" label="회사">
        <TextInput placeholder="ACME Inc." />
      </FormField>
      <FormField name="content" label="문의사항">
        <label
          class={flex({
            align: 'center',
            borderWidth: '1px',
            borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
            borderRadius: '10px',
            paddingX: '16px',
            paddingY: '10px',
            textStyle: '16r',
            color: 'gray.1000',
            backgroundColor: 'white',
            transition: 'common',
            _hover: {
              borderColor: 'brand.400',
            },
            '&:has(textarea:focus)': {
              borderColor: 'brand.600',
            },
          })}
        >
          <textarea
            class={css({
              flexGrow: '1',
              width: 'full',
              minWidth: '0',
              resize: 'none',
            })}
            placeholder="자유롭게 문의사항을 작성해주세요"
            rows="3"
          ></textarea>
        </label>
      </FormField>

      <Button style={css.raw({ marginTop: '16px' })} glossy size="lg" type="submit">문의하기</Button>
    </FormProvider>
  </div>
</div>
