<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Helmet, Icon, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import CheckIcon from '~icons/lucide/check';
  import CopyIcon from '~icons/lucide/copy';
  import ExternalLinkIcon from '~icons/lucide/external-link';
  import { graphql } from '$graphql';
  import { ProBadge } from '$lib/components';
  import { isPro } from '$lib/svelte/stores/ui';

  const query = graphql(`
    query SiteSettingsWidgetPage_Query($siteId: ID!) {
      site(siteId: $siteId) {
        id
        name

        widget {
          id
          outLink
        }
      }
    }
  `);

  let copied = $state(false);

  const updateSiteWidget = graphql(`
    mutation SiteSettingsWidgetPage_UpdateSiteWidget_Mutation($input: UpdateSiteWidgetInput!) {
      updateSiteWidget(input: $input) {
        id
        outLink
      }
    }
  `);

  const { form, isDirty, setIsDirty, setInitialValues, context } = createMutationForm({
    schema: z.object({
      siteId: z.string(),
      outLink: z
        .string()
        .trim()
        .refine((val) => val === '' || z.string().url().safeParse(val).success, { message: '잘못된 URL이에요' }),
    }),
    mutation: async ({ siteId, outLink }) => {
      return await updateSiteWidget({ siteId, outLink: outLink === '' ? null : outLink });
    },
    onSuccess: async ({ outLink }) => {
      setIsDirty(false);

      if (outLink) {
        toast.success('문의 페이지 링크가 변경되었습니다');
        mixpanel.track('site:widget:update');
      } else {
        toast.success('문의 페이지 링크가 해제되었습니다');
        mixpanel.track('site:widget:delete');
      }
    },
  });

  setInitialValues({
    siteId: $query.site.id,
    outLink: $query.site.widget?.outLink ?? '',
  });

  const scriptEnd = '></script';
  const scriptText = `<script
  data-site-id='${$query.site.id}'
  defer
  src='https://sdk.rdbl.io/script.js'
${scriptEnd}>`;
</script>

<Helmet title="위젯 설정" trailing={$query.site.name} />

<div class={flex({ align: 'center', gap: '2px', marginBottom: '20px', textStyle: '28b' })}>
  <h1>위젯</h1>
  <ProBadge via="site-widget:pro-badge" />
</div>

<div
  class={css({
    marginBottom: '8px',
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '10px',
    padding: '32px',
    width: 'full',
    maxWidth: '720px',
    backgroundColor: 'surface.primary',
  })}
>
  <h2 class={css({ marginBottom: '8px', textStyle: '16sb' })}>위젯 설정</h2>

  <p class={css({ marginBottom: '12px', color: 'text.tertiary', textStyle: '14r' })}>
    {$isPro ? '아래 스크립트 코드를 복사해서 사용하세요' : 'Pro 플랜부터 아래 코드를 추가해 위젯을 이용할 수 있습니다'}
  </p>

  <div
    class={flex({
      align: 'flex-start',
      justify: 'space-between',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'neutral.10',
    })}
  >
    <pre
      class={css(
        {
          textStyle: '12r',
          color: $isPro ? 'text.secondary' : 'text.disabled',
          fontFamily: 'mono',
        },
        !$isPro && { userSelect: 'none' },
      )}>{scriptText}</pre>

    {#if $isPro}
      <button
        onclick={() => {
          try {
            navigator.clipboard.writeText(scriptText);
            copied = true;

            setTimeout(() => {
              copied = false;
            }, 1000);
          } catch (err) {
            toast.error('클립보드 복사를 실패했어요');
            console.error(err);
          }
        }}
        type="button"
      >
        <Icon style={css.raw({ color: 'neutral.50' })} icon={copied ? CheckIcon : CopyIcon} size={14} />
      </button>
    {/if}
  </div>

  <a
    class={flex({
      align: 'center',
      gap: '2px',
      marginTop: '16px',
      textStyle: '12m',
      color: 'text.secondary',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      width: 'fit',
    })}
    href="https://docs.rdbl.io/widget/settings"
    rel="noopener noreferrer"
    target="_blank"
  >
    <span>위젯 설치 가이드</span>
    <Icon icon={ExternalLinkIcon} size={14} />
  </a>
</div>

<FormProvider
  class={css({
    marginBottom: '8px',
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '10px',
    padding: '32px',
    width: 'full',
    maxWidth: '720px',
    backgroundColor: 'surface.primary',
  })}
  {context}
  {form}
>
  <FormField
    name="outLink"
    description="문의 링크를 입력하면 현재 사용 중인 문의 채널로 바로 이동할 수 있는 버튼이 위젯에 추가됩니다"
    label="문의 링크"
  >
    <TextInput disabled={!$isPro} placeholder="example.com" />
  </FormField>

  <div class={flex({ marginTop: '8px', gap: '8px', justifyContent: 'flex-end' })}>
    <Button disabled={!$isPro} size="lg" type="submit" variant={$isDirty ? 'primary' : 'secondary'}>설정</Button>
  </div>
</FormProvider>
