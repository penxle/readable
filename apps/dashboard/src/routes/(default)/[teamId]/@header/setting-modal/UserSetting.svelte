<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, HorizontalDivider, Icon, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { run } from 'svelte/legacy';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import TriangleAlertIcon from '~icons/lucide/triangle-alert';
  import { goto } from '$app/navigation';
  import { fragment, graphql } from '$graphql';
  import { AvatarInput, TitledModal } from '$lib/components';
  import { accessToken } from '$lib/graphql';
  import type { UserSetting_user } from '$graphql';

  type Props = {
    $user: UserSetting_user;
  };

  let { $user: _user }: Props = $props();

  let deactivateOpen = $state(false);

  const user = fragment(
    _user,
    graphql(`
      fragment UserSetting_user on User {
        id
        name
        email

        avatar {
          id
        }

        teams {
          id
        }
      }
    `),
  );

  const { form, data, setInitialValues, isDirty, setIsDirty, context } = createMutationForm({
    schema: z.object({
      avatarId: z.string(),
      name: dataSchemas.user.name,
    }),
    mutation: graphql(`
      mutation UserSetting_UpdateUser_Mutation($input: UpdateUserInput!) {
        updateUser(input: $input) {
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
      toast.success('개인 설정이 변경되었습니다');

      mixpanel.track('user:update');
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const {
    form: deactivateForm,
    data: deactivateFormData,
    context: deactivateFormContext,
  } = createMutationForm({
    schema: z.object({
      email: dataSchemas.email,
    }),
    mutation: graphql(`
      mutation UserSetting_DeactivateUser_Mutation {
        deactivateUser {
          id
        }
      }
    `),
    onSuccess: () => {
      $accessToken = null;
      mixpanel.reset();
      goto('/', { replaceState: true });
    },
  });

  run(() => {
    if ($user) {
      setInitialValues({ avatarId: $user.avatar.id, name: $user.name });
    }
  });
</script>

<h1 class={css({ textStyle: '28eb' })}>개인 설정</h1>

<HorizontalDivider style={css.raw({ marginTop: '20px', marginBottom: '40px' })} />

<FormProvider {context} {form}>
  <div class={flex({ flexDirection: 'column', gap: '24px' })}>
    <FormField name="avatar" label="이미지" noMessage>
      <AvatarInput onchange={() => setIsDirty(true)} bind:id={$data.avatarId} />
    </FormField>
    <FormField name="name" label="이름">
      <TextInput name="name" placeholder="이름" />
    </FormField>
    <FormField name="" description="이메일은 수정할 수 없어요" label="이메일">
      <TextInput disabled value={$user.email} />
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

<div>
  <h2 class={css({ marginBottom: '6px', textStyle: '14sb', color: 'text.danger' })}>계정 삭제</h2>
  <p class={css({ textStyle: '14r', color: 'text.tertiary' })}>
    {#if $user.teams.length > 0}
      계정이 팀에 속해있으면 계정을 삭제할 수 없습니다.
      <br />
      <!-- prettier-ignore -->
      <span>
        팀 떠나기는 팀 대시보드의
        &lbrack;<a class={css({ textDecoration: 'underline' })} href="/{$user.teams[0].id}/members">멤버 관리</a>&rbrack;에서
        할 수 있습니다
      </span>
    {:else}
      계정 삭제 시 모든 정보가 영구적으로 삭제되며, 되돌릴 수 없습니다
    {/if}
  </p>

  <Button
    style={css.raw({ marginTop: '8px', marginLeft: 'auto' })}
    disabled={$user.teams.length > 0}
    onclick={() => (deactivateOpen = true)}
    size="lg"
    variant="danger-fill"
  >
    계정 삭제
  </Button>
</div>

<TitledModal bind:open={deactivateOpen}>
  {#snippet title()}
    계정 삭제
  {/snippet}

  <p class={css({ marginBottom: '10px', textStyle: '13r', color: 'text.tertiary' })}>
    탈퇴 시 모든 정보가 영구적으로 제거되며, 되돌릴 수 없습니다.
    <br />
    탈퇴를 진행하시려면 아래 프로필명을 입력해 주세요
  </p>

  <div
    class={flex({
      align: 'center',
      gap: '6px',
      marginBottom: '20px',
      borderRadius: '8px',
      paddingX: '10px',
      paddingY: '8px',
      textStyle: '13m',
      color: 'text.danger',
      backgroundColor: 'danger.10',
    })}
  >
    <Icon icon={TriangleAlertIcon} />
    <p>삭제를 진행하시려면 아래에 다음 문구를 입력해주세요: {$user.email}</p>
  </div>

  <FormProvider context={deactivateFormContext} form={deactivateForm}>
    <FormField name="email" label="이메일">
      <TextInput placeholder={$user.email} />
    </FormField>

    <Button
      style={css.raw({ marginTop: '20px', width: 'full' })}
      disabled={$deactivateFormData.email !== $user.email}
      size="lg"
      type="submit"
      variant="danger-fill"
    >
      계정 삭제
    </Button>
  </FormProvider>
</TitledModal>
