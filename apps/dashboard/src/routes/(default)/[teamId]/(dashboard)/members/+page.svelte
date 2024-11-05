<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
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
  import { toast } from '@readable/ui/notification';
  import { GraphQLError } from 'graphql';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import CheckIcon from '~icons/lucide/check';
  import ChevronDownIcon from '~icons/lucide/chevron-down';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import InfoIcon from '~icons/lucide/info';
  import MailOpenIcon from '~icons/lucide/mail-open';
  import PlusIcon from '~icons/lucide/plus';
  import UserRoundMinusIcon from '~icons/lucide/user-round-minus';
  import UserXIcon from '~icons/lucide/user-x';
  import { goto, invalidateAll } from '$app/navigation';
  import { graphql } from '$graphql';
  import { ProBadge } from '$lib/components';
  import Img from '$lib/components/Img.svelte';
  import { invokeAlert } from '$lib/components/invoke-alert';
  import TitledModal from '$lib/components/TitledModal.svelte';
  import { isLiteOrHigher, isPro } from '$lib/svelte/stores/ui';

  let isInviteModalOpen = $state(false);

  const query = graphql(`
    query TeamMembersPage_Query($teamId: ID!) {
      team(teamId: $teamId) {
        id
        name

        avatar {
          id
          ...Img_image
        }

        meAsMember {
          id
          role
        }

        members {
          id
          role
          isSoleAdmin

          user {
            id
            email
            name

            avatar {
              id
              ...Img_image
            }
          }
        }

        invitations {
          id
          email
        }

        plan {
          id

          plan {
            id

            rules {
              memberLimit
            }
          }
        }
      }
    }
  `);

  const { form, reset, setErrors, context } = createMutationForm({
    mutation: graphql(`
      mutation TeamMembersPage_InviteTeamMember_Mutation($input: InviteTeamMemberInput!) {
        inviteTeamMember(input: $input) {
          ... on TeamMember {
            id
          }

          ... on TeamMemberInvitation {
            id
            email
            createdAt
          }
        }
      }
    `),
    schema: z.object({
      teamId: dataSchemas.team.id,
      email: dataSchemas.email,
    }),
    onSuccess: () => {
      toast.success('초대 이메일이 발송되었습니다');
      reset();

      mixpanel.track('team:member:invitation:send');
    },
    onError: (e: unknown) => {
      if (e instanceof GraphQLError) {
        // FIXME: unexpected error
        setErrors({ email: e.message });
      } else {
        setErrors({ email: '알 수 없는 오류가 발생했습니다.' });
      }
    },
  });

  const resendInvitationEmail = graphql(`
    mutation TeamMembersPage_ResendInvitationEmail_Mutation($input: ResendInvitationEmailInput!) {
      resendInvitationEmail(input: $input) {
        id
      }
    }
  `);

  const revokeInvitation = graphql(`
    mutation TeamMembersPage_RevokeInvitation_Mutation($input: RevokeInvitationInput!) {
      revokeInvitation(input: $input) {
        id
      }
    }
  `);

  const updateTeamMemberRole = graphql(`
    mutation TeamMembersPage_UpdateTeamMemberRole_Mutation($input: UpdateTeamMemberRoleInput!) {
      updateTeamMemberRole(input: $input) {
        id
        role
      }
    }
  `);

  const removeTeamMember = graphql(`
    mutation TeamMembersPage_RemoveTeamMember_Mutation($input: RemoveTeamMemberInput!) {
      removeTeamMember(input: $input) {
        id
      }
    }
  `);

  const setRoleToMember = async (userId: string, teamId: string) => {
    await updateTeamMemberRole({
      role: 'MEMBER',
      userId,
      teamId,
    });

    mixpanel.track('team:member:role:update', {
      role: 'MEMBER',
    });
  };
</script>

<Helmet title="멤버 관리" trailing={$query.team.name} />

<div class={css({ marginX: 'auto', paddingTop: '40px', paddingBottom: '120px', width: 'full', maxWidth: '920px' })}>
  <div class={flex({ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' })}>
    <h1 class={css({ textStyle: '28b' })}>
      멤버
      <span class={css({ color: 'text.tertiary' })}>{$query.team.members.length}</span>
    </h1>

    {#if $query.team.meAsMember?.role === 'ADMIN'}
      {#if $isLiteOrHigher}
        {#if !$isPro && $query.team.plan.plan.rules.memberLimit && $query.team.members.length >= $query.team.plan.plan.rules.memberLimit}
          <Tooltip message="Pro 플랜부터 멤버를 더 초대할 수 있어요" placement="bottom">
            <Button style={css.raw({ gap: '6px' })} disabled size="sm" type="button">
              <span>초대하기</span>
              <Icon icon={InfoIcon} size={16} />
            </Button>
          </Tooltip>
        {:else}
          <Button style={css.raw({ gap: '6px' })} onclick={() => (isInviteModalOpen = true)} size="sm" type="button">
            <span>초대하기</span>
            <Icon icon={PlusIcon} size={16} />
          </Button>
        {/if}
      {:else}
        <Tooltip message="Lite 플랜부터 멤버를 초대할 수 있어요" placement="bottom">
          <Button style={css.raw({ gap: '6px' })} disabled size="sm" type="button">
            <span>초대하기</span>
            <Icon icon={InfoIcon} size={16} />
          </Button>
        </Tooltip>
      {/if}
    {/if}
  </div>

  <ul
    class={flex({
      flexDirection: 'column',
      borderWidth: '1px',
      borderColor: 'border.primary',
      borderRadius: '10px',
      paddingX: '34px',
      paddingY: '18px',
      backgroundColor: 'surface.primary',
    })}
  >
    {#each $query.team.invitations as invitation (invitation.id)}
      <li class={flex({ alignItems: 'center', gap: '16px' })}>
        <div class={flex({ align: 'center', gap: '12px', grow: 1 })}>
          <div
            class={center({
              borderWidth: '1px',
              borderColor: 'border.image',
              borderRadius: 'full',
              borderStyle: 'dashed',
              textStyle: '16b',
              color: 'neutral.40',
              backgroundColor: 'surface.secondary',
              size: '40px',
            })}
          >
            {invitation.email[0].toUpperCase()}
          </div>

          <p class={css({ textStyle: '14r', color: 'text.tertiary' })}>{invitation.email}</p>
        </div>

        <div class={css({ paddingX: '16px', paddingY: '22px' })}>
          <p
            class={css({
              paddingX: '8px',
              paddingY: '4px',
              textStyle: '16m',
              color: 'text.secondary',
              width: '86px',
            })}
          >
            <span>초대중</span>
          </p>
        </div>

        <div class={flex({ width: '60px', justifyContent: 'center', alignItems: 'center' })}>
          <Menu listStyle={css.raw({ gap: '1px' })} offset={2} placement="bottom-start">
            {#snippet button()}
              <div
                class={css({
                  borderRadius: '6px',
                  padding: '4px',
                  color: 'text.secondary',
                  _hover: {
                    backgroundColor: 'neutral.20',
                  },
                })}
              >
                <Icon icon={EllipsisIcon} size={20} />
              </div>
            {/snippet}

            <MenuItem
              onclick={async () => {
                await resendInvitationEmail({ invitationId: invitation.id });
                toast.success('초대 이메일이 재발송되었습니다');

                mixpanel.track('team:member:invitation:resend');
              }}
            >
              <Icon icon={MailOpenIcon} size={14} />
              <span>이메일 재발송</span>
            </MenuItem>
            <MenuItem
              onclick={async () => {
                invokeAlert({
                  title: '초대를 취소하시겠어요?',
                  content: '발송된 초대 이메일에 포함된 링크는 더 이상 작동하지 않습니다',
                  action: '발송 취소',
                  onaction: async () => {
                    await revokeInvitation({ invitationId: invitation.id });

                    mixpanel.track('team:member:invitation:revoke');
                  },
                });
              }}
              variant="danger"
            >
              <Icon icon={UserXIcon} size={14} />
              <span>초대 취소</span>
            </MenuItem>
          </Menu>
        </div>
      </li>
    {/each}

    {#each $query.team.members as member (member.id)}
      <li class={flex({ alignItems: 'center', gap: '16px' })}>
        <div class={flex({ flex: '1', alignItems: 'center', gap: '12px', truncate: true })}>
          <Img
            style={css.raw({
              borderWidth: '1px',
              borderColor: 'border.image',
              borderRadius: 'full',
              size: '40px',
            })}
            $image={member.user.avatar}
            alt={`${member.user.name}의 아바타`}
            size={48}
          />
          <div class={flex({ flexDirection: 'column', truncate: true })}>
            <p class={css({ textStyle: '16sb', color: 'text.secondary', truncate: true })}>{member.user.name}</p>
            <p class={css({ textStyle: '14r', color: 'text.tertiary', truncate: true })}>{member.user.email}</p>
          </div>
        </div>

        <div class={css({ flexShrink: 0, paddingX: '16px', paddingY: '22px' })}>
          {#if $query.team.meAsMember?.role === 'ADMIN'}
            <Menu
              listStyle={css.raw({ borderRadius: '[18px]', paddingY: '8px', paddingX: '2px' })}
              offset={6}
              placement="bottom-start"
            >
              {#snippet button()}
                <div
                  class={flex({
                    width: '86px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingX: '8px',
                    paddingY: '4px',
                    textStyle: '16m',
                    color: 'text.secondary',
                    borderRadius: '6px',
                    _hover: {
                      backgroundColor: 'neutral.20',
                    },
                  })}
                >
                  <span>{member.role === 'ADMIN' ? '관리자' : '편집자'}</span>
                  <Icon style={css.raw({ color: 'neutral.60' })} icon={ChevronDownIcon} size={16} />
                </div>
              {/snippet}

              <MenuItem
                style={css.raw({ gap: '20px', borderRadius: '10px', paddingY: '10px' })}
                aria-checked={member.role === 'ADMIN'}
                onclick={async () => {
                  await updateTeamMemberRole({
                    role: 'ADMIN',
                    userId: member.user.id,
                    teamId: $query.team.id,
                  });

                  mixpanel.track('team:member:role:update', {
                    role: 'ADMIN',
                  });
                }}
              >
                <div class={flex({ flexDirection: 'column', alignItems: 'start', gap: '2px', width: 'full' })}>
                  <p class={css({ textStyle: '15sb', color: 'text.primary' })}>관리자</p>
                  <p class={css({ textStyle: '13r', color: 'text.tertiary' })}>
                    사이트 및 팀 설정 변경, 문서 편집, 발행 및 삭제
                  </p>
                </div>

                <Icon
                  style={css.raw(
                    { visibility: 'hidden', color: 'accent.60' },
                    member.role === 'ADMIN' && { visibility: 'visible' },
                  )}
                  icon={CheckIcon}
                  size={16}
                />
              </MenuItem>
              <MenuItem
                style={css.raw({
                  gap: '20px',
                  borderRadius: '10px',
                  paddingY: '10px',
                  _disabled: {
                    '& p': {
                      color: 'text.disabled',
                    },
                  },
                })}
                aria-checked={member.role === 'MEMBER'}
                disabled={(member.role === 'ADMIN' && member.isSoleAdmin) || !$isPro}
                onclick={async () => {
                  if (member.id === $query.team.meAsMember?.id) {
                    invokeAlert({
                      title: '스스로의 역할을 편집자로 변경하시겠어요?',
                      content: '이 작업은 되돌릴 수 없으며, 더 이상 설정을 변경할 수 없게 됩니다',
                      action: '변경',
                      onaction: async () => {
                        setRoleToMember(member.user.id, $query.team.id);
                      },
                    });
                  } else {
                    setRoleToMember(member.user.id, $query.team.id);
                  }
                }}
              >
                <div class={flex({ flexDirection: 'column', alignItems: 'start', gap: '2px', width: 'full' })}>
                  <div class={flex({ alignItems: 'center' })}>
                    <p class={css({ textStyle: '15sb', color: 'text.primary' })}>편집자</p>
                    <ProBadge via="team-member-role:pro-badge" />
                  </div>
                  <p class={css({ textStyle: '13r', color: 'text.tertiary' })}>문서 편집, 발행 및 삭제</p>
                </div>

                {#if member.role === 'MEMBER'}
                  <Icon style={css.raw({ color: 'accent.60' })} icon={CheckIcon} size={16} />
                {/if}
              </MenuItem>
            </Menu>
          {:else}
            <div
              class={css({
                paddingX: '8px',
                paddingY: '4px',
                textStyle: '16m',
                color: 'text.secondary',
                width: '86px',
              })}
            >
              {member.role === 'ADMIN' ? '관리자' : '편집자'}
            </div>
          {/if}
        </div>

        <div class={flex({ width: '60px', justifyContent: 'center', alignItems: 'center' })}>
          {#if member.id === $query.team.meAsMember?.id && !member.isSoleAdmin}
            <Menu offset={2} placement="bottom-start">
              {#snippet button()}
                <div
                  class={flex({
                    borderRadius: '6px',
                    padding: '4px',
                    color: 'text.secondary',
                    _hover: {
                      backgroundColor: 'neutral.20',
                    },
                  })}
                >
                  <Icon icon={EllipsisIcon} size={20} />
                </div>
              {/snippet}
              <MenuItem
                onclick={async () => {
                  invokeAlert({
                    title: '팀에서 떠나시겠어요?',
                    content: '더 이상 팀 대시보드에 접근할 수 없습니다',
                    action: '떠나기',
                    onaction: async () => {
                      await removeTeamMember({ userId: member.user.id, teamId: $query.team.id });

                      mixpanel.track('team:member:remove:self');

                      if (member.id === $query.team.meAsMember?.id) {
                        await invalidateAll();
                        await goto('/');
                      }
                    },
                  });
                }}
                variant="danger"
              >
                {#snippet prefix()}
                  <Icon icon={UserRoundMinusIcon} size={14} />
                {/snippet}
                <span>팀에서 떠나기</span>
              </MenuItem>
            </Menu>
          {:else if $query.team.meAsMember?.role === 'ADMIN' && !(member.id === $query.team.meAsMember?.id && member.isSoleAdmin)}
            <Menu offset={2} placement="bottom-start">
              {#snippet button()}
                <div
                  class={flex({
                    borderRadius: '6px',
                    padding: '4px',
                    color: 'text.secondary',
                    _hover: {
                      backgroundColor: 'neutral.20',
                    },
                  })}
                >
                  <Icon icon={EllipsisIcon} size={20} />
                </div>
              {/snippet}
              <MenuItem
                onclick={async () => {
                  invokeAlert({
                    title: `"${member.user.name}"님을 팀에서 제거하시겠어요?`,
                    content: '제거된 멤버는 더 이상 팀 대시보드에 접근할 수 없습니다',
                    action: '제거',
                    onaction: async () => {
                      await removeTeamMember({ userId: member.user.id, teamId: $query.team.id });

                      toast.success(`${member.user.name}님을 팀에서 제거했습니다`);

                      mixpanel.track('team:member:remove');
                    },
                  });
                }}
                variant="danger"
              >
                {#snippet prefix()}
                  <Icon icon={UserRoundMinusIcon} size={14} />
                {/snippet}
                <span>팀에서 제거</span>
              </MenuItem>
            </Menu>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
</div>

<TitledModal bind:open={isInviteModalOpen}>
  {#snippet title()}
    <div class={flex({ alignItems: 'center', gap: '10px' })}>
      <Img
        style={css.raw({
          borderWidth: '1px',
          borderColor: 'border.image',
          borderRadius: 'full',
          size: '24px',
        })}
        $image={$query.team.avatar}
        alt={`${$query.team.name}의 아바타`}
        size={24}
      />
      팀에 초대하기
    </div>
  {/snippet}

  <FormProvider class={flex({ flexDirection: 'column', gap: '16px' })} {context} {form}>
    <input name="teamId" type="hidden" value={$query.team.id} />

    <FormField name="email" label="이메일">
      <TextInput placeholder="me@example.com" />
    </FormField>

    <Button style={css.raw({ marginLeft: 'auto' })} size="md" type="submit">초대하기</Button>
  </FormProvider>
</TitledModal>
