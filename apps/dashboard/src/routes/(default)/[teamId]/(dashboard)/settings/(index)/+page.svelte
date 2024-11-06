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
    TextInput,
    Tooltip,
  } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import TriangleAlertIcon from '~icons/lucide/triangle-alert';
  import { goto } from '$app/navigation';
  import { graphql } from '$graphql';
  import { AvatarInput, TitledModal } from '$lib/components';

  const query = graphql(`
    query TeamSettingsPage_Query($teamId: ID!) {
      team(teamId: $teamId) {
        id
        name

        meAsMember {
          id
          role
        }

        avatar {
          id
        }

        sites {
          id
        }
      }
    }
  `);

  const deleteTeam = graphql(`
    mutation TeamSettingsPage_DeleteTeam_Mutation($input: DeleteTeamInput!) {
      deleteTeam(input: $input) {
        id
      }
    }
  `);

  const { form, data, setInitialValues, isDirty, setIsDirty, context } = createMutationForm({
    schema: z.object({
      teamId: z.string(),
      avatarId: z.string(),
      name: dataSchemas.team.name,
    }),
    mutation: graphql(`
      mutation TeamSettingPage_UpdateTeam_Mutation($input: UpdateTeamInput!) {
        updateTeam(input: $input) {
          id
          name

          avatar {
            id
          }
        }
      }
    `),
    onSuccess: () => {
      setIsDirty(false);
      toast.success('팀 설정이 변경되었습니다');

      mixpanel.track('team:update');
    },
    onError: (error) => {
      console.log(error);
    },
  });

  setInitialValues({ avatarId: $query.team.avatar.id, name: $query.team.name, teamId: $query.team.id });

  let deleteTeamOpen = $state(false);

  const {
    form: deleteForm,
    data: deleteFormData,
    context: deleteFormContext,
  } = createMutationForm({
    schema: z.object({
      teamId: z.string(),
      teamName: z.string(),
    }),
    mutation: async ({ teamId }) => {
      await deleteTeam({ teamId });
      mixpanel.track('team:delete');
      await goto('/');
    },
  });
</script>

<Helmet title="팀 설정" trailing={$query.team.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>일반</h1>

<div
  class={css({
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '[20px]',
    padding: '32px',
    backgroundColor: 'surface.primary',
  })}
>
  <FormProvider {context} {form}>
    <input name="teamId" type="hidden" />

    <div class={flex({ flexDirection: 'column', gap: '24px' })}>
      <FormField name="avatar" label="팀 로고" noMessage>
        <AvatarInput
          editable={$query.team.meAsMember?.role !== 'MEMBER'}
          onchange={() => setIsDirty(true)}
          bind:id={$data.avatarId}
        />
      </FormField>
      <FormField name="name" label="팀 이름">
        <TextInput name="name" disabled={$query.team.meAsMember?.role === 'MEMBER'} placeholder="ACME Inc." />
      </FormField>
    </div>

    <div class={flex({ marginTop: '8px', gap: '8px', justify: 'flex-end' })}>
      {#if $isDirty}
        <Button size="lg" type="reset" variant="secondary">되돌리기</Button>
      {/if}
      <Button disabled={!$isDirty} size="lg" type="submit">변경</Button>
    </div>
  </FormProvider>

  <HorizontalDivider style={css.raw({ marginY: '40px' })} />

  <div class={css({ textStyle: '14sb', color: 'text.danger' })}>팀 삭제</div>

  <div class={css({ marginTop: '6px', textStyle: '14r', color: 'text.tertiary' })}>
    {#if $query.team.sites.length > 0}
      사이트 삭제 후 팀 삭제가 가능합니다.
      <br />
      사이트 삭제는 [사이트 설정] - [일반] 메뉴에서 할 수 있습니다
    {:else}
      팀 삭제 시 모든 멤버 및 관리자 정보가 영구적으로 제거되며, 되돌릴 수 없습니다.
    {/if}
  </div>

  <Tooltip
    style={css.raw({ marginTop: '8px', marginLeft: 'auto', width: 'fit' })}
    enabled={$query.team.sites.length > 0}
    message="사이트 삭제 후 팀 삭제가 가능해요"
    placement="top"
  >
    <Button
      disabled={$query.team.sites.length > 0}
      onclick={() => {
        deleteTeamOpen = true;
      }}
      size="lg"
      variant="danger-fill"
    >
      삭제
    </Button>
  </Tooltip>
</div>

<TitledModal bind:open={deleteTeamOpen}>
  {#snippet title()}
    팀 삭제
  {/snippet}

  <p
    class={css({
      color: 'text.tertiary',
      textStyle: '13r',
    })}
  >
    팀 삭제 시 모든 멤버 및 관리자 정보가 영구적으로 제거되며, 되돌릴 수 없습니다.
    <br />
    삭제를 진행하시려면 아래 팀 이름을 입력해 주세요.
  </p>

  <div
    class={flex({
      align: 'center',
      gap: '6px',
      marginTop: '10px',
      borderRadius: '8px',
      paddingX: '10px',
      paddingY: '8px',
      textStyle: '13m',
      color: 'text.danger',
      backgroundColor: 'danger.10',
      '& b': {
        textStyle: '13b',
      },
    })}
  >
    <Icon icon={TriangleAlertIcon} />
    <p>
      삭제를 진행하시려면 아래에 다음 문구를 입력해주세요:
      <b>{$query.team.name}</b>
    </p>
  </div>

  <FormProvider context={deleteFormContext} form={deleteForm}>
    <input name="teamId" type="hidden" value={$query.team.id} />

    <FormField name="teamName" style={css.raw({ marginTop: '20px' })} label="팀 이름">
      <TextInput name="teamName" placeholder={$query.team.name} />
    </FormField>

    <Button
      style={css.raw({ width: 'full', marginTop: '20px' })}
      disabled={$deleteFormData.teamName !== $query.team.name}
      size="lg"
      type="submit"
      variant="danger-fill"
    >
      삭제
    </Button>
  </FormProvider>
</TitledModal>
