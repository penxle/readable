<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex, grid } from '@readable/styled-system/patterns';
  import {
    Button,
    FormField,
    FormProvider,
    Helmet,
    Icon,
    Menu,
    MenuItem,
    TextInput,
    Tooltip,
  } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import dayjs from 'dayjs';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import AppWindowIcon from '~icons/lucide/app-window';
  import CloudUploadIcon from '~icons/lucide/cloud-upload';
  import EarthIcon from '~icons/lucide/earth';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import InfoIcon from '~icons/lucide/info';
  import PlusIcon from '~icons/lucide/plus';
  import SettingsIcon from '~icons/lucide/settings';
  import { goto } from '$app/navigation';
  import { graphql } from '$graphql';
  import { Img, TitledModal } from '$lib/components';

  let createSiteOpen = $state(false);

  const query = graphql(`
    query TeamPage_Query($teamId: ID!) {
      team(teamId: $teamId) {
        id
        name

        sites {
          id
          name
          url
          pageCount
          pageUpdatedAt

          logo {
            id
            ...Img_image
          }
        }

        plan {
          id

          plan {
            id

            rules {
              siteLimit
            }
          }
        }
      }
    }
  `);

  const createSite = graphql(`
    mutation TeamPage_CreateSite_Mutation($input: CreateSiteInput!) {
      createSite(input: $input) {
        id

        firstPage {
          id
        }
      }
    }
  `);

  const { form, context } = createMutationForm({
    schema: z.object({
      teamId: dataSchemas.team.id,
      name: dataSchemas.site.name,
    }),
    mutation: async ({ teamId, name }) => {
      return await createSite({ teamId, name });
    },
    onSuccess: async (res) => {
      mixpanel.track('site:create');

      await goto(`/${$query.team.id}/${res.id}/${res.firstPage?.id ?? ''}`);
      createSiteOpen = false;
    },
  });
</script>

<Helmet title={$query.team.name} />

{#if $query.team.sites.length > 0}
  <div
    class={flex({
      direction: 'column',
      maxWidth: '1280px',
      marginX: 'auto',
      paddingTop: '40px',
      paddingBottom: '120px',
      width: 'full',
    })}
  >
    <div class={flex({ align: 'center', justify: 'space-between', marginBottom: '24px' })}>
      <h1 class={css({ textStyle: '28b' })}>
        사이트
        <span class={css({ color: 'text.tertiary' })}>{$query.team.sites.length}</span>
      </h1>
      {#if typeof $query.team.plan.plan.rules.siteLimit !== 'number' || $query.team.plan.plan.rules.siteLimit > $query.team.sites.length}
        <Button style={css.raw({ gap: '6px' })} onclick={() => (createSiteOpen = true)} size="sm" type="button">
          <span>만들기</span>
          <Icon icon={PlusIcon} size={16} />
        </Button>
      {:else}
        <Tooltip message="Pro 플랜부터 사이트를 더 만들 수 있어요" placement="bottom">
          <Button style={css.raw({ gap: '6px' })} disabled size="sm" type="button">
            <span>만들기</span>
            <Icon icon={InfoIcon} size={16} />
          </Button>
        </Tooltip>
      {/if}
    </div>
    <ul class={grid({ columns: 3, gap: '16px' })}>
      {#each $query.team.sites as site (site.id)}
        <li
          class={flex({
            position: 'relative',
            align: 'flex-start',
            justify: 'space-between',
            borderWidth: '1px',
            borderColor: 'border.primary',
            borderRadius: '10px',
            backgroundColor: 'surface.primary',
          })}
        >
          <a
            class={flex({
              align: 'flex-start',
              padding: '16px',
              paddingRight: '50px',
              gap: '12px',
              grow: '1',
              truncate: true,
            })}
            href={`/${$query.team.id}/${site.id}`}
          >
            {#if site.logo}
              <Img
                style={css.raw({ flex: 'none', marginTop: '4px', borderRadius: '6px' })}
                $image={site.logo}
                alt={`${site.name}의 로고`}
                size={32}
              />
            {:else}
              <div
                class={css({
                  flex: 'none',
                  marginTop: '4px',
                  borderWidth: '1px',
                  borderColor: 'border.primary',
                  borderStyle: 'dashed',
                  borderRadius: '6px',
                  size: '32px',
                })}
              ></div>
            {/if}
            <div class={css({ truncate: true })}>
              <p class={css({ marginBottom: '1px', textStyle: '15sb', truncate: true })}>{site.name}</p>
              <p class={css({ marginBottom: '24px', textStyle: '13r', color: 'text.tertiary', truncate: true })}>
                {site.url}
              </p>
              <dl class={css({ textStyle: '13r', color: 'text.tertiary' })}>
                <div class={flex({ align: 'center', gap: '6px' })}>
                  <dt>페이지 수</dt>
                  <dd>{site.pageCount}</dd>
                </div>
                <div class={flex({ align: 'center', gap: '6px' })}>
                  <dt>마지막 페이지 수정일</dt>
                  <dd>{dayjs(site.pageUpdatedAt).formatAsDate()}</dd>
                </div>
              </dl>
            </div>
          </a>
          <Menu style={css.raw({ position: 'absolute', right: '16px', top: '16px' })} placement="bottom-start">
            {#snippet button()}
              <div
                class={css({
                  borderRadius: '6px',
                  padding: '4px',
                  color: 'neutral.50',
                  _hover: { backgroundColor: 'neutral.20' },
                })}
              >
                <Icon icon={EllipsisIcon} size={16} />
              </div>
            {/snippet}
            <MenuItem href={`/${$query.team.id}/${site.id}`} type="link">
              <Icon icon={AppWindowIcon} size={14} />
              <span>대시보드 이동</span>
            </MenuItem>
            <MenuItem href={site.url} type="link">
              <Icon icon={EarthIcon} size={14} />
              <span>사이트 바로가기</span>
            </MenuItem>
            <MenuItem href={`/${$query.team.id}/${site.id}/settings`} type="link">
              <Icon icon={SettingsIcon} size={14} />
              <span>사이트 설정</span>
            </MenuItem>
          </Menu>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <div
    class={flex({
      direction: 'column',
      align: 'center',
      justify: 'center',
      gap: '24px',
      margin: 'auto',
      width: 'full',
    })}
  >
    <Icon style={css.raw({ size: '60px' })} icon={CloudUploadIcon} />
    <div class={css({ textAlign: 'center' })}>
      <h1 class={css({ textStyle: '22b', marginBottom: '4px' })}>첫 사이트를 만들어보세요</h1>
      <p class={css({ textStyle: '15r', color: 'text.secondary' })}>
        도움센터, 업데이트 노트, 개발자 문서 등 다양한 사이트를 제작해보세요
      </p>
    </div>
    <Button onclick={() => (createSiteOpen = true)} size="lg">사이트 만들기</Button>
  </div>
{/if}

<TitledModal bind:open={createSiteOpen}>
  {#snippet title()}
    새 사이트 만들기
  {/snippet}

  <FormProvider {context} {form}>
    <input name="teamId" type="hidden" value={$query.team.id} />

    <FormField name="name" description="설정에서 언제든지 변경할 수 있어요" label="사이트 이름">
      <TextInput placeholder="ACME 도움센터" />
    </FormField>

    <Button style={css.raw({ marginTop: '16px', marginLeft: 'auto' })} type="submit">만들기</Button>
  </FormProvider>
</TitledModal>
