<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import {
    Button,
    FormField,
    FormProvider,
    HorizontalDivider,
    Icon,
    Menu,
    MenuItem,
    TextInput,
  } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import mixpanel from 'mixpanel-browser';
  import qs from 'query-string';
  import { onMount } from 'svelte';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import ChevronDownIcon from '~icons/lucide/chevron-down';
  import { goto } from '$app/navigation';
  import { graphql } from '$graphql';
  import UserMenu from '../(default)/[teamId]/@header/UserMenu.svelte';

  let query = $derived(
    graphql(`
      query NewPage_Query {
        ...UserMenu_query

        me @required {
          id
          name
          email

          avatar {
            id
            url
            ...Img_image
          }

          teams {
            id
          }
        }
      }
    `),
  );

  const createDefaultTeam = graphql(`
    mutation NewPage_CreateDefaultTeam_Mutation {
      createDefaultTeam {
        id
      }
    }
  `);

  const createSite = graphql(`
    mutation NewPage_CreateSite_Mutation($input: CreateSiteInput!) {
      createSite(input: $input) {
        id

        team {
          id
        }

        firstPage {
          id
        }
      }
    }
  `);

  const { form, context } = createMutationForm({
    mutation: async ({ name }) => {
      const team = await createDefaultTeam();

      mixpanel.track('team:create');
      mixpanel.register({
        team_id: team.id,
      });

      return await createSite({ teamId: team.id, name });
    },
    schema: z.object({
      teamId: dataSchemas.team.id,
      name: dataSchemas.site.name,
    }),
    onSuccess: async (resp) => {
      mixpanel.track('site:create');
      mixpanel.track('user:onboarding:complete', {
        purpose,
        role: jobRole,
      });

      await goto(`/${resp.team.id}/${resp.id}/${resp.firstPage?.id ?? ''}`);
    },
  });

  let purpose = $state('');
  let jobRole = $state('');

  onMount(() => {
    mixpanel.identify($query.me.id);

    mixpanel.people.set({
      $email: $query.me.email,
      $name: $query.me.name,
      $avatar: qs.stringifyUrl({ url: $query.me.avatar.url, query: { s: 256, f: 'png' } }),
    });

    mixpanel.track('user:onboarding:start');
  });
</script>

<header class={flex({ align: 'center', justify: 'flex-end', paddingTop: '24px', paddingX: '24px', height: '64px' })}>
  <UserMenu {$query} />
</header>

<div
  class={flex({
    direction: 'column',
    align: 'center',
    gap: '40px',
    margin: 'auto',
    paddingX: '20px',
    paddingBottom: '64px',
    width: 'full',
    maxWidth: '432px',
  })}
>
  <div>
    <h1 class={css({ marginBottom: '4px', textStyle: '26sb', textAlign: 'center' })}>사이트를 만들어보세요</h1>
    <p class={css({ textStyle: '15r', color: 'text.secondary' })}>
      도움센터, 업데이트노트, 개발자 문서 등 다양한 사이트를 제작해보세요
    </p>
  </div>

  <FormProvider class={css({ width: 'full' })} {context} {form}>
    <div
      class={flex({
        direction: 'column',
        borderRadius: '16px',
        paddingTop: '24px',
        paddingX: '20px',
        paddingBottom: '36px',
        boxShadow: 'strong',
      })}
    >
      <input name="teamId" type="hidden" />
      <FormField name="name" description="설정에서 언제든지 변경할 수 있어요" label="사이트 이름 *">
        <TextInput placeholder="ACME 도움센터" />
      </FormField>

      <HorizontalDivider style={css.raw({ marginTop: '12px', marginBottom: '24px' })} />

      <p class={css({ marginBottom: '8px', textStyle: '14sb', color: { base: 'gray.700', _dark: 'darkgray.300' } })}>
        도입 목적
      </p>

      <Menu placement="bottom" setFullWidth>
        {#snippet button({ open })}
          <div
            class={css(
              {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                outlineWidth: '1px',
                outlineColor: { base: 'gray.200', _dark: 'darkgray.700' },
                borderRadius: '8px',
                paddingX: '16px',
                paddingY: '6px',
                width: 'full',
                _hover: { outlineColor: { base: 'brand.400', _dark: 'brand.300' } },
              },
              open && {
                outlineWidth: '2px',
                outlineColor: { base: 'brand.600', _dark: 'brand.500' },
                backgroundColor: { base: 'red.100', _dark: '[#880808/20]' },
              },
            )}
          >
            <span
              class={css(
                { textStyle: '16r' },
                purpose === '' && { color: { base: 'gray.600', _dark: 'darkgray.400' } },
              )}
            >
              {purpose === '' ? '선택' : purpose}
            </span>
            <Icon style={css.raw({ color: 'neutral.50' })} icon={ChevronDownIcon} size={18} />
          </div>
        {/snippet}

        <MenuItem on:click={() => (purpose = '고객용 도움센터')}>고객용 도움센터</MenuItem>
        <MenuItem on:click={() => (purpose = '업데이트 노트')}>업데이트 노트</MenuItem>
        <MenuItem on:click={() => (purpose = '개발자 문서')}>개발자 문서</MenuItem>
        <MenuItem on:click={() => (purpose = '사내 문서')}>사내 문서</MenuItem>
        <MenuItem on:click={() => (purpose = '기타')}>기타</MenuItem>
      </Menu>

      <p
        class={css({
          marginTop: '24px',
          marginBottom: '8px',
          textStyle: '14sb',
          color: { base: 'gray.700', _dark: 'darkgray.300' },
        })}
      >
        직군
      </p>

      <Menu setFullWidth>
        {#snippet button({ open })}
          <div
            class={css(
              {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                outlineWidth: '1px',
                outlineColor: { base: 'gray.200', _dark: 'darkgray.700' },
                borderRadius: '8px',
                paddingX: '16px',
                paddingY: '6px',
                width: 'full',
                _hover: { outlineColor: { base: 'brand.400', _dark: 'brand.300' } },
              },
              open && {
                outlineWidth: '2px',
                outlineColor: { base: 'brand.600', _dark: 'brand.500' },
                backgroundColor: { base: 'red.100', _dark: '[#880808/20]' },
              },
            )}
          >
            <span
              class={css(
                { textStyle: '16r' },
                jobRole === '' && { color: { base: 'gray.600', _dark: 'darkgray.400' } },
              )}
            >
              {jobRole === '' ? '선택' : jobRole}
            </span>
            <Icon style={css.raw({ color: 'neutral.50' })} icon={ChevronDownIcon} size={18} />
          </div>
        {/snippet}

        <MenuItem on:click={() => (jobRole = '운영/고객지원')}>운영/고객지원</MenuItem>
        <MenuItem on:click={() => (jobRole = '기획/마케팅')}>기획/마케팅</MenuItem>
        <MenuItem on:click={() => (jobRole = '개발')}>개발</MenuItem>
        <MenuItem on:click={() => (jobRole = '디자인')}>디자인</MenuItem>
        <MenuItem on:click={() => (jobRole = '1인 사업자/프리랜서')}>1인 사업자/프리랜서</MenuItem>
        <MenuItem on:click={() => (jobRole = '기타')}>기타</MenuItem>
      </Menu>
    </div>

    <div
      class={css({
        position: 'relative',
        marginTop: '20px',
      })}
    >
      <Button style={css.raw({ width: 'full' })} glossy size="lg" type="submit">시작하기</Button>
    </div>
  </FormProvider>
</div>
