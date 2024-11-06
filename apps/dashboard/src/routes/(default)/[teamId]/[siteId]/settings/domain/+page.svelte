<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import {
    Button,
    FormField,
    FormProvider,
    Helmet,
    HorizontalDivider,
    Icon,
    Menu,
    MenuItem,
    TextInput,
  } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { untrack } from 'svelte';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import CheckIcon from '~icons/lucide/check';
  import CircleCheckIcon from '~icons/lucide/circle-check';
  import CopyIcon from '~icons/lucide/copy';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import SearchCheckIcon from '~icons/lucide/search-check';
  import Trash2Icon from '~icons/lucide/trash-2';
  import TriangleAlertIcon from '~icons/lucide/triangle-alert';
  import { env } from '$env/dynamic/public';
  import { graphql } from '$graphql';
  import { Img, LiteBadge } from '$lib/components';
  import { invokeAlert } from '$lib/components/invoke-alert';
  import TitledModal from '$lib/components/TitledModal.svelte';

  let open = $state(false);

  let hostCopied = $state(false);
  let valueCopied = $state(false);

  let unsubscribe = $state<() => void>();

  const query = graphql(`
    query SiteSettingsDomainPage_Query($siteId: ID!) {
      site(siteId: $siteId) {
        id
        name

        logo {
          id
          ...Img_image
        }

        customDomain {
          id
          domain
          state
        }

        team {
          id

          plan {
            id

            plan {
              id

              rules {
                customDomain
              }
            }
          }
        }
      }
    }
  `);

  const { form, isValid, setInitialValues, context } = createMutationForm({
    mutation: graphql(`
      mutation SiteSettingsDomainPage_SetSiteCustomDomain_Mutation($input: SetSiteCustomDomainInput!) {
        setSiteCustomDomain(input: $input) {
          id
          domain
          state
        }
      }
    `),
    schema: z.object({
      siteId: z.string(),
      domain: dataSchemas.site.domain,
    }),
    onSuccess: async () => {
      query.refetch();
      open = true;
      mixpanel.track('site:custom-domain:set');
    },
  });

  const unsetSiteCustomDomain = graphql(`
    mutation SiteSettingsDomainPage_UnsetSiteCustomDomain_Mutation($input: UnsetSiteCustomDomainInput!) {
      unsetSiteCustomDomain(input: $input) {
        id
        domain
        state
      }
    }
  `);

  const siteCustomDomainValidationStream = graphql(`
    subscription SiteSettingsDomainPage_SiteCustomDomainValidationStream_Subscription($siteCustomDomainId: ID!) {
      siteCustomDomainValidationStream(siteCustomDomainId: $siteCustomDomainId) {
        id
        domain
        state
      }
    }
  `);

  siteCustomDomainValidationStream.on('data', ({ siteCustomDomainValidationStream }) => {
    if (siteCustomDomainValidationStream.state === 'ACTIVE') {
      open = false;
      unsubscribe = undefined;
      mixpanel.track('site:custom-domain:validation:success');
    }
  });

  const verifyStream = () => {
    if ($query.site.customDomain?.id) {
      unsubscribe = siteCustomDomainValidationStream.subscribe({
        siteCustomDomainId: $query.site.customDomain.id,
      });
      mixpanel.track('site:custom-domain:validation:start');
    }
  };

  setInitialValues({ siteId: $query.site.id, domain: $query.site.customDomain?.domain ?? '' });

  $effect(() => {
    if (open === false) {
      untrack(() => {
        unsubscribe?.();
        unsubscribe = undefined;
      });
    }
  });
</script>

<Helmet title="커스텀 도메인 설정" trailing={$query.site.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>커스텀 도메인</h1>

{#if $query.site.customDomain}
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
    <h2
      class={css({
        display: 'block',
        marginBottom: '8px',
        textStyle: '14sb',
        color: { base: 'gray.700', _dark: 'gray.300' },
      })}
    >
      연결된 도메인
    </h2>
    <div class={flex({ alignItems: 'center', borderBottomWidth: '1px', borderColor: 'divider.primary' })}>
      <p
        class={css({
          flex: '1',
          marginRight: '16px',
          textStyle: '16r',
          color: 'text.secondary',
          truncate: true,
        })}
      >
        {$query.site.customDomain.domain}
      </p>
      <div
        class={flex({
          width: '114px',
          height: '54px',
          gap: '6px',
          alignItems: 'center',
          color: $query.site.customDomain.state === 'ACTIVE' ? '[#6CB425]' : '[#E9A137]',
        })}
      >
        {#if $query.site.customDomain.state === 'ACTIVE'}
          <Icon icon={CircleCheckIcon} size={16} />
          <span class={css({ textStyle: '14sb' })}>확인됨</span>
        {:else}
          <Icon icon={TriangleAlertIcon} size={16} />
          <span class={css({ textStyle: '14sb' })}>확인되지 않음</span>
        {/if}
      </div>
      <Menu style={css.raw({ marginX: '10px' })} placement="bottom-start">
        {#snippet button()}
          <div
            class={css({
              borderRadius: '4px',
              padding: '4px',
              color: 'text.secondary',
              _hover: { backgroundColor: 'neutral.20' },
            })}
          >
            <Icon icon={EllipsisIcon} size={20} />
          </div>
        {/snippet}
        {#if $query.site.customDomain.state !== 'ACTIVE'}
          <MenuItem
            onclick={() => {
              open = true;
              verifyStream();
            }}
            variant="default"
          >
            <Icon icon={SearchCheckIcon} size={14} />
            <span>재확인</span>
          </MenuItem>
        {/if}
        <MenuItem
          onclick={() => {
            invokeAlert({
              title: '커스텀 도메인을 제거하시겠어요?',
              content: '커스텀 도메인을 제거하면 기존 주소로는 접근할 수 없습니다',
              action: '제거',
              onaction: async () => {
                if ($query.site.customDomain) {
                  await unsetSiteCustomDomain({ siteCustomDomainId: $query.site.customDomain.id });
                  mixpanel.track('site:custom-domain:unset');
                  location.reload();
                }
              },
            });
          }}
          variant="danger"
        >
          <Icon icon={Trash2Icon} size={14} />
          <span>제거</span>
        </MenuItem>
      </Menu>
    </div>
  </div>
{:else}
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
    <input name="siteId" type="hidden" />
    <FormField name="domain" label="커스텀 도메인 URL">
      {#snippet labelSuffix()}
        <LiteBadge disabled={!$query.site.team.plan.plan.rules.customDomain} via="site-custom-domain:lite-badge" />
      {/snippet}

      <TextInput
        name="domain"
        disabled={!!$query.site.customDomain || !$query.site.team.plan.plan.rules.customDomain}
        placeholder="docs.example.com"
      />
    </FormField>

    <Button style={css.raw({ marginTop: '8px', marginLeft: 'auto' })} disabled={!$isValid} size="lg" type="submit">
      설정
    </Button>
  </FormProvider>
{/if}

<TitledModal bind:open>
  {#snippet title()}
    <div class={flex({ alignItems: 'center', gap: '8px' })}>
      {#if $query.site.logo}
        <Img
          style={css.raw({
            borderWidth: '1px',
            borderColor: 'border.image',
            borderRadius: '4px',
            size: '24px',
          })}
          $image={$query.site.logo}
          alt={`${$query.site.name}의 아바타`}
          size={24}
        />
      {/if}
      DNS 레코드를 추가해주세요
    </div>
  {/snippet}

  <div class={flex({ direction: 'column', gap: '20px' })}>
    <div class={css({ textStyle: '13r', color: 'text.secondary' })}>
      <p>사용중인 도메인 관리 페이지에서 아래 DNS 레코드를 추가해 주세요.</p>
      <p>- Cloudflare DNS를 이용 중인 경우 프록시 상태를 DNS 전용으로 설정해 주세요.</p>
      <p>- TTL 설정이 필요한 경우 Auto 혹은 300초 (5분) 이하로 설정해 주세요.</p>
    </div>

    <HorizontalDivider />

    <dl
      class={flex({
        '& > div > dt': {
          paddingX: '16px',
          paddingY: '10px',
          textStyle: '15sb',
          color: 'text.tertiary',
          backgroundColor: 'neutral.10',
        },
        '& > div > dd': {
          borderYWidth: '1px',
          borderColor: 'divider.primary',
          paddingX: '16px',
          paddingY: '12px',
          color: 'text.secondary',
        },
      })}
    >
      <div>
        <dt>Type</dt>
        <dd>CNAME</dd>
      </div>

      <div class={css({ flex: '1', truncate: true })}>
        <dt>Host</dt>
        <dd class={flex({ align: 'center', gap: '8px' })}>
          <span class={css({ truncate: true })}>{$query.site.customDomain?.domain}</span>
          <button
            onclick={() => {
              if (!$query.site.customDomain) {
                return;
              }

              try {
                navigator.clipboard.writeText($query.site.customDomain.domain);
                hostCopied = true;

                setTimeout(() => {
                  hostCopied = false;
                }, 1000);
              } catch (err) {
                toast.error('클립보드 복사를 실패했어요');
                console.error(err);
              }
            }}
            type="button"
          >
            <Icon style={css.raw({ color: 'neutral.40' })} icon={hostCopied ? CheckIcon : CopyIcon} size={14} />
          </button>
        </dd>
      </div>

      <div>
        <dt>Value</dt>
        <dd class={flex({ align: 'center', gap: '8px' })}>
          <span>{env.PUBLIC_USERSITE_CNAME_HOST}</span>
          <button
            onclick={() => {
              try {
                navigator.clipboard.writeText(env.PUBLIC_USERSITE_CNAME_HOST);
                valueCopied = true;

                setTimeout(() => {
                  valueCopied = false;
                }, 1000);
              } catch (err) {
                toast.error('클립보드 복사를 실패했어요');
                console.error(err);
              }
            }}
            type="button"
          >
            <Icon style={css.raw({ color: 'neutral.40' })} icon={valueCopied ? CheckIcon : CopyIcon} size={14} />
          </button>
        </dd>
      </div>
    </dl>

    <Button loading={!!unsubscribe} onclick={verifyStream} size="lg" type="button">DNS 레코드 확인</Button>
  </div>
</TitledModal>
