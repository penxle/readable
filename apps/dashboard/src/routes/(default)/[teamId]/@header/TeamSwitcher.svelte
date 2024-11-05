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
  import { fragment, graphql } from '$graphql';
  import { Img, TitledModal } from '$lib/components';
  import type { TeamSwitcher_user } from '$graphql';

  type Props = {
    $user: TeamSwitcher_user;
  };

  let { $user: _user }: Props = $props();

  let user = $derived(
    fragment(
      _user,
      graphql(`
        fragment TeamSwitcher_user on User {
          id
          teams {
            id
            name
            avatar {
              id
              ...Img_image
            }
          }
        }
      `),
    ),
  );

  let currentTeamId = $derived($page.params.teamId);

  const createTeam = graphql(`
    mutation TeamSwitcher_CreateTeam_Mutation($input: CreateTeamInput!) {
      createTeam(input: $input) {
        id
      }
    }
  `);

  let newTeamModalOpen = $state(false);

  const { form: newTeamForm, context: newTeamFormContext } = createMutationForm({
    schema: z.object({
      name: dataSchemas.team.name,
    }),
    mutation: async ({ name }) => {
      const result = await createTeam({ name });
      mixpanel.track('team:create');

      await goto(`/${result.id}`);
      newTeamModalOpen = false;
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
        alignItems: 'center',
        borderRadius: '6px',
        padding: '3px',
        color: 'neutral.50',
        _hover: { backgroundColor: 'neutral.20' },
      })}
      aria-label="팀 선택"
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
    팀
  </div>

  {#each $user.teams as team (team.id)}
    <MenuItem
      style={css.raw({
        padding: '8px',
        columnGap: '8px',
        _currentPage: {
          backgroundColor: 'neutral.20',
          pointerEvents: 'none',
        },
      })}
      aria-current={currentTeamId === team.id ? 'page' : undefined}
      on:click={() => goto(`/${team.id}`)}
    >
      <Img
        style={css.raw({ borderWidth: '1px', borderColor: 'border.image', size: '20px', borderRadius: 'full' })}
        $image={team.avatar}
        alt={`${team.name}의 로고`}
        size={24}
      />
      <span class={css({ textStyle: '14m', truncate: true })}>{team.name}</span>
      {#if currentTeamId === team.id}
        <Icon style={css.raw({ marginLeft: 'auto', color: 'text.accent' })} icon={CheckIcon} size={16} />
      {/if}
    </MenuItem>
  {/each}

  <MenuItem
    style={flex.raw({ paddingX: '10px', color: 'text.tertiary', gap: '10px' })}
    on:click={() => (newTeamModalOpen = true)}
  >
    <Icon icon={CirclePlusIcon} size={16} />
    <span>새 팀 만들기</span>
  </MenuItem>
</Menu>

<TitledModal bind:open={newTeamModalOpen}>
  {#snippet title()}
    새 팀 만들기
  {/snippet}

  <FormProvider context={newTeamFormContext} form={newTeamForm}>
    <FormField name="name" label="팀 이름">
      <TextInput name="name" placeholder="ACME Inc." />
    </FormField>

    <Button style={css.raw({ marginTop: '16px', marginLeft: 'auto' })} type="submit">만들기</Button>
  </FormProvider>
</TitledModal>
