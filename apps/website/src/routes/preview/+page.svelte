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

  let darkSection: HTMLElement = $state();

  const { form, context } = createMutationForm({
    schema: z.object({
      email: dataSchemas.email,
      docsUrl: dataSchemas.url,
    }),
    mutation: async (data) => {
      const { error } = await supabase.from('previews').insert([
        {
          email: data.email,
          docs_url: data.docsUrl,
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

  let darkSections = $derived([darkSection].filter(Boolean));
</script>

<Helmet
  description="빠르게 움직이는 팀을 위한 문서 이전 서비스. 문서 주소만 보내주시면 24시간 내에 리더블로 옮겨드려요"
  image={{ src: 'https://cdn.rdbl.app/opengraph/cover.png', size: 'large' }}
  title="이사 신청"
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
      빠른 팀을 위한 문서 이전 서비스
    </h1>

    <p class={css({ textStyle: { base: '14m', lg: '22m' }, textAlign: 'center' })}>
      기존 문서가 리더블에서는 어떻게 보일지 궁금하신가요?
      <br />
      문서 주소만 보내주시면 24시간 내에 리더블로 옮겨드려요
    </p>
  </div>
</div>

<div class={css({ background: '[linear-gradient(180deg, #FFF 0%, #FAFAFA 74.47%)]' })}>
  <div
    class={css({
      marginX: 'auto',
      paddingX: '20px',
      paddingBottom: '120px',
      width: 'full',
      maxWidth: '590px',
    })}
  >
    <FormProvider
      class={flex({ direction: 'column', gap: '16px', marginTop: { base: '60px', lg: '80px' } })}
      {context}
      {form}
    >
      <FormField name="docsUrl" label="문서 주소">
        <TextInput placeholder="https://docs.example.com" />
      </FormField>
      <FormField name="email" label="받아보실 이메일">
        <TextInput placeholder="me@example.com" />
      </FormField>

      <Button style={css.raw({ marginTop: '16px' })} glossy size="lg" type="submit">신청하기</Button>
    </FormProvider>
  </div>
</div>
