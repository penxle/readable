<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Helmet, Switch, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { onMount } from 'svelte';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import { graphql } from '$graphql';
  import { LiteBadge } from '$lib/components';
  import { invokeAlert } from '$lib/components/invoke-alert';

  let useSiteHeaderLink = $state(false);

  const query = graphql(`
    query SiteSettingsLinkPage_Query($siteId: ID!) {
      site(siteId: $siteId) {
        id
        name

        headerLink {
          id
          label
          url
          state
        }

        team {
          id

          plan {
            id

            plan {
              id

              rules {
                headerLink
              }
            }
          }
        }
      }
    }
  `);

  onMount(() => {
    useSiteHeaderLink = $query.site.headerLink?.state === 'ACTIVE';
  });

  const disableSiteHeaderLink = graphql(`
    mutation SiteSettingsLinkPage_DisableSiteHeaderLink_Mutation($input: DisableSiteHeaderLinkInput!) {
      disableSiteHeaderLink(input: $input) {
        id
      }
    }
  `);

  const { form, isValid, context, setInitialValues, isDirty, reset, setFields, setIsDirty } = createMutationForm({
    mutation: graphql(`
      mutation SiteSettingsLinkPage_SetSiteHeaderLink_Mutation($input: SetSiteHeaderLinkInput!) {
        setSiteHeaderLink(input: $input) {
          id
        }
      }
    `),
    schema: z.object({
      siteId: z.string(),
      label: z.string().min(1, { message: '이름을 입력해 주세요' }),
      url: dataSchemas.url,
    }),
    onSuccess: async () => {
      setIsDirty(false);

      toast.success('헤더 링크 버튼이 설정되었습니다');
      mixpanel.track('site:header-link:set');
      query.refetch();
    },
  });

  $effect(() => {
    setInitialValues({
      siteId: $query.site.id,
      label: $query.site.headerLink?.label ?? '',
      url: $query.site.headerLink?.url ?? '',
    });
  });
</script>

<Helmet title="헤더 링크 버튼 설정" trailing={$query.site.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>헤더 링크 버튼</h1>

<div
  class={css({
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '10px',
    padding: '32px',
    width: 'full',
    maxWidth: '720px',
    backgroundColor: 'surface.primary',
  })}
>
  <div class={flex({ align: 'center', justify: 'space-between', marginBottom: '24px', textStyle: '16sb' })}>
    <div class={flex({ align: 'center' })}>
      헤더 링크 버튼 사용
      <LiteBadge disabled={!$query.site.team.plan.plan.rules.headerLink} via="site-link-button:lite-badge" />
    </div>
    <Switch
      name="useSiteHeaderLink"
      disabled={!$query.site.team.plan.plan.rules.headerLink}
      onchange={(e) => {
        if (!e.currentTarget.checked) {
          if ($query.site.headerLink?.state === 'ACTIVE') {
            invokeAlert({
              title: '헤더 링크 버튼을 제거할까요?',
              content: '더 이상 사이트 헤더에 링크 버튼이 나타나지 않게 됩니다',
              action: '제거',
              oncancel: () => {
                useSiteHeaderLink = true;
              },
              onaction: async () => {
                if ($query.site.headerLink) {
                  await disableSiteHeaderLink({ siteHeaderLinkId: $query.site.headerLink.id });
                  mixpanel.track('site:header-link:disable');
                  setFields('label', '');
                  setFields('url', '');
                }
              },
            });
          }

          reset();
        }
      }}
      bind:checked={useSiteHeaderLink}
    />
  </div>

  <FormProvider {context} {form}>
    <input name="siteId" type="hidden" />

    <FormField name="label" style={css.raw({ marginBottom: '24px' })} label="버튼 텍스트">
      <TextInput
        disabled={!$query.site.team.plan.plan.rules.headerLink || !useSiteHeaderLink}
        placeholder="서비스 바로가기"
      />
    </FormField>
    <FormField name="url" label="URL">
      <TextInput
        disabled={!$query.site.team.plan.plan.rules.headerLink || !useSiteHeaderLink}
        placeholder="app.example.com"
      />
    </FormField>

    <div class={flex({ align: 'center', justify: 'flex-end', gap: '8px', marginTop: '8px' })}>
      {#if $isDirty}
        <Button size="lg" type="reset" variant="secondary">되돌리기</Button>
      {/if}
      <Button disabled={!$isValid || !useSiteHeaderLink} size="lg" type="submit">설정</Button>
    </div>
  </FormProvider>
</div>
