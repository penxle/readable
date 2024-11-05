<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Icon, Menu, MenuItem, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import CheckIcon from '~icons/lucide/check';
  import ChevronDownIcon from '~icons/lucide/chevron-down';
  import CirclePlusIcon from '~icons/lucide/circle-plus';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ProPlan } from '$assets/plan';
  import { fragment, graphql } from '$graphql';
  import { Img, ProBadge, TitledModal } from '$lib/components';
  import { isPlanUpgradeModalOpen, isPro, selectedPlan } from '$lib/svelte/stores/ui';
  import type { SiteSwitcher_team } from '$graphql';

  type Props = {
    $team: SiteSwitcher_team;
  };

  let { $team: _team }: Props = $props();

  let team = $derived(
    fragment(
      _team,
      graphql(`
        fragment SiteSwitcher_team on Team {
          id

          sites {
            id
            name
            logo {
              id
              ...Img_image
            }
          }
        }
      `),
    ),
  );

  let currentSiteId = $derived($page.params.siteId);

  const createSite = graphql(`
    mutation TeamLayout_CreateSite_Mutation($input: CreateSiteInput!) {
      createSite(input: $input) {
        id

        firstPage {
          id
        }
      }
    }
  `);

  let newSiteModalOpen = $state(false);

  const { form: newSiteForm, context: newSiteFormContext } = createMutationForm({
    schema: z.object({
      teamId: dataSchemas.team.id,
      name: dataSchemas.site.name,
    }),
    mutation: async ({ teamId, name }) => {
      const result = await createSite({ teamId, name });
      mixpanel.track('site:create');

      await goto(`/${teamId}/${result.id}/${result.firstPage?.id ?? ''}`);
      newSiteModalOpen = false;
    },
  });
</script>

<Menu
  listStyle={css.raw({ width: '220px' })}
  offset={{
    mainAxis: 6,
    crossAxis: -24,
  }}
  placement="bottom-start"
>
  {#snippet button()}
    <button
      class={flex({
        borderRadius: '6px',
        padding: '3px',
        color: 'neutral.50',
        _hover: { backgroundColor: 'neutral.20' },
      })}
      aria-label="사이트 선택"
      type="button"
    >
      <Icon icon={ChevronDownIcon} size={16} />
    </button>
  {/snippet}

  <div
    class={css({
      paddingX: '12px',
      paddingY: '5px',
      textStyle: '13m',
      color: 'text.tertiary',
    })}
  >
    사이트
  </div>

  {#each $team.sites as site (site.id)}
    <MenuItem
      style={css.raw({
        padding: '8px',
        columnGap: '8px',
        _currentPage: {
          backgroundColor: 'neutral.20',
          pointerEvents: 'none',
        },
      })}
      aria-current={currentSiteId === site.id ? 'page' : undefined}
      href={`/${$team.id}/${site.id}`}
      type="link"
    >
      {#if site.logo}
        <Img
          style={css.raw({ size: '20px', borderRadius: '4px' })}
          $image={site.logo}
          alt={`${site.name}의 로고`}
          size={24}
        />
      {:else}
        <div
          class={flex({
            flexShrink: 0,
            size: '20px',
            borderWidth: '[1.5px]',
            borderColor: 'neutral.30',
            borderStyle: 'dashed',
            borderRadius: '4px',
          })}
          aria-hidden="true"
        ></div>
      {/if}
      <span class={css({ textStyle: '14m', truncate: true })}>{site.name}</span>
      {#if currentSiteId === site.id}
        <Icon style={css.raw({ marginLeft: 'auto', color: 'text.accent' })} icon={CheckIcon} size={16} />
      {/if}
    </MenuItem>
  {/each}

  <MenuItem
    style={flex.raw({ paddingX: '10px', color: 'text.tertiary', gap: '10px' })}
    on:click={() => {
      if ($isPro) {
        newSiteModalOpen = true;
      } else {
        mixpanel.track('plan:upgrade:show', { via: 'site-switcher:new-site-button' });
        isPlanUpgradeModalOpen.set(true);
        selectedPlan.set(ProPlan);
      }
    }}
  >
    <Icon icon={CirclePlusIcon} size={16} />
    <span>새 사이트 만들기</span>
    <ProBadge style={css.raw({ marginLeft: 'auto' })} via="site-switcher:pro-badge" />
  </MenuItem>
</Menu>

<TitledModal bind:open={newSiteModalOpen}>
  {#snippet title()}
    새 사이트 만들기
  {/snippet}

  <FormProvider context={newSiteFormContext} form={newSiteForm}>
    <input name="teamId" type="hidden" value={$team.id} />
    <FormField name="name" description="설정에서 언제든지 변경할 수 있어요" label="사이트 이름">
      <TextInput placeholder="ACME 도움센터" />
    </FormField>

    <Button style={css.raw({ marginTop: '16px', marginLeft: 'auto' })} type="submit">만들기</Button>
  </FormProvider>
</TitledModal>
