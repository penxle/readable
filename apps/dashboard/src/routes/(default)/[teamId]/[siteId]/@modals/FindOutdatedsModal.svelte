<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Icon, Tooltip } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import diff from 'fast-diff';
  import mixpanel from 'mixpanel-browser';
  import { getContext } from 'svelte';
  import { run } from 'svelte/legacy';
  import { z } from 'zod';
  import FileTextIcon from '~icons/lucide/file-text';
  import InfoIcon from '~icons/lucide/info';
  import MessageSquarePlusIcon from '~icons/lucide/message-square-plus';
  import Trash2Icon from '~icons/lucide/trash-2';
  import { graphql } from '$graphql';
  import { TitledModal } from '$lib/components';
  import AiIcon from './@ai/AiIcon.svelte';
  import AiLoading from './@ai/AiLoading.svelte';

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();

  const site = getContext<{
    id: string;
  }>('site');

  let lastQuery: string | null = $state(null);
  let loading = $state(false);
  let outdateds: Awaited<ReturnType<typeof findOutdatedContent.refetch>>['findOutdatedContent'] = $state([]);

  function reset() {
    lastQuery = null;
    loading = false;
    outdateds = [];
  }

  run(() => {
    if (open) {
      reset();
    }
  });

  const findOutdatedContent = graphql(`
    query FindOutdatedsModal_Query($query: String!, $siteId: String!) @manual {
      findOutdatedContent(query: $query, siteId: $siteId) {
        fixes {
          nodeId
          original
          reason
          relevance
          suggestion
        }
        page {
          id
          title
        }
      }
    }
  `);

  // FIXME: query를 위해 mutation form을..?
  const { form, context, data } = createMutationForm({
    schema: z.object({
      query: z.string(),
      siteId: z.string(),
    }),
    mutation: async ({ query, siteId }) => {
      mixpanel.track('site:content-renewal', { query });
      loading = true;
      lastQuery = query;
      const result = await findOutdatedContent.refetch({ query, siteId });
      outdateds = result?.findOutdatedContent ?? [];
      loading = false;
    },
  });

  const addPageContentComment = graphql(`
    mutation FindOutdatedsModal_AddPageContentComment_Mutation($input: AddPageContentCommentInput!) {
      addPageContentComment(input: $input) {
        id
      }
    }
  `);

  const removeSuggestion = async (pageId: string, fix: { nodeId: string }) => {
    for (const outdated of outdateds) {
      if (outdated.page.id === pageId) {
        outdated.fixes = outdated.fixes.filter((f) => f !== fix);

        if (outdated.fixes.length === 0) {
          outdateds = outdateds.filter((o) => o !== outdated);
        }
      }
    }

    outdateds = outdateds;
  };

  const markSuggestion = async (
    pageId: string,
    fix: { nodeId: string; original: string; reason: string; suggestion: string },
  ) => {
    await addPageContentComment({
      content: `"${fix.suggestion}"으로 수정해야 합니다. (${fix.reason})`,
      pageId,
      nodeId: fix.nodeId,
    });

    removeSuggestion(pageId, fix);
  };

  const markAllSuggestions = async () => {
    const promises = [];

    for (const outdated of outdateds) {
      for (const fix of outdated.fixes) {
        promises.push(markSuggestion(outdated.page.id, fix));
      }
    }

    await Promise.all(promises);
  };
</script>

<TitledModal style={css.raw({ width: '700px' })} bind:open>
  {#snippet title()}
    <div class={flex({ alignItems: 'center', gap: '8px' })}>
      콘텐츠 최신화
      <div
        class={center({
          paddingX: '8px',
          paddingY: '4px',
          borderRadius: 'full',
          textStyle: '12r',
          color: 'accent.70',
          backgroundColor: 'accent.10',
        })}
      >
        Beta
      </div>
    </div>
  {/snippet}

  {#if lastQuery === null}
    <FormProvider {context} {form}>
      <input name="siteId" hidden value={site.id} />
      <FormField name="query" noMessage>
        <label
          class={flex({
            align: 'center',
            borderWidth: '1px',
            borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
            borderRadius: '10px',
            paddingX: '16px',
            paddingY: '10px',
            textStyle: '16r',
            color: 'gray.1000',
            backgroundColor: 'white',
            transition: 'common',
            _hover: {
              borderColor: 'brand.400',
            },
            '&:has(textarea:focus)': {
              borderColor: 'brand.600',
            },
          })}
        >
          <textarea
            name="query"
            class={css({
              flexGrow: '1',
              width: 'full',
              minWidth: '0',
              resize: 'none',
            })}
            placeholder="콘텐츠에 반영해야 할 변경 사항을 자유롭게 입력해주세요"
            rows="4"
          ></textarea>
        </label>
      </FormField>
      <Button
        style={css.raw({ width: 'full', marginTop: '18px' })}
        disabled={$data.query?.trim() === ''}
        glossy
        type="submit"
      >
        낡은 문서 찾기
      </Button>
    </FormProvider>
  {:else if loading}
    <div
      class={flex({
        alignItems: 'center',
        gap: '12px',
        paddingX: '18px',
        paddingY: '24px',
        borderRadius: '8px',
        backgroundColor: 'neutral.10',
        borderWidth: '1px',
        borderColor: 'border.primary',
        color: 'text.secondary',
        textStyle: '16sb',
      })}
    >
      <AiIcon variant="gradient" />
      <p>낡은 문서를 찾는 중입니다. 잠시만 기다려주세요.</p>
      <AiLoading />
    </div>
  {:else if outdateds.length > 0}
    <div class={flex({ flexDirection: 'column', gap: '16px', overflow: 'auto' })}>
      <div
        class={flex({
          alignItems: 'center',
          gap: '12px',
          paddingX: '18px',
          paddingY: '24px',
          borderRadius: '8px',
          backgroundColor: 'neutral.10',
          borderWidth: '1px',
          borderColor: 'border.primary',
          color: 'text.secondary',
          textStyle: '16sb',
        })}
      >
        <AiIcon variant="gradient" />
        <p>
          총 {outdateds.length}개의 페이지에서 낡은 콘텐츠를 찾았습니다.
          <br />
          수정이 필요한 지점에 수정 제안을 코멘트로 마크하거나, 무시할 수 있습니다.
        </p>
      </div>
      {#each outdateds as outdated (outdated.page.id)}
        <div>
          <div
            class={flex({
              alignItems: 'center',
              gap: '4px',
              textStyle: '16sb',
              color: 'text.secondary',
              marginBottom: '8px',
            })}
          >
            <Icon icon={FileTextIcon} size={16} />
            {outdated.page.title}
          </div>
          <div
            class={css({
              marginLeft: '2px',
              borderLeftWidth: '1px',
              borderColor: 'border.secondary',
              paddingLeft: '8px',
            })}
          >
            {#each outdated.fixes as fix, index (index)}
              <div
                class={css({
                  marginBottom: '8px',
                })}
              >
                <div
                  class={cx(
                    'group',
                    css({
                      position: 'relative',
                      marginBottom: '4px',
                      borderWidth: '1px',
                      borderColor: 'border.secondary',
                      backgroundColor: 'neutral.10',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      color: 'text.primary',
                    }),
                  )}
                >
                  <div
                    class={css({
                      backgroundColor: '[#ffdbdb77]',
                      '& del': {
                        backgroundColor: '[#FF818266]',
                        textDecorationColor: '[rgba(200, 100, 100, 0.4)]',
                      },
                    })}
                  >
                    {@html diff(fix.original, fix.suggestion)
                      .map(([type, text]) => {
                        if (type === 0) return text;
                        if (type === -1) return `<del>${text}</del>`;
                      })
                      .join('')}
                  </div>
                  <div
                    class={css({
                      backgroundColor: '[#d4ffdd77]',
                      '& ins': {
                        backgroundColor: '[#ABFEBC]',
                        textDecoration: 'none',
                      },
                    })}
                  >
                    {@html diff(fix.original, fix.suggestion)
                      .map(([type, text]) => {
                        if (type === 0) return text;
                        if (type === 1) return `<ins>${text}</ins>`;
                      })
                      .join('')}
                  </div>

                  <div
                    class={flex({
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      justifyContent: 'flex-end',
                      opacity: '10',
                      gap: '4px',
                      _groupHover: {
                        opacity: '100',
                      },
                    })}
                  >
                    <Tooltip message="코멘트로 남기기" placement="top-end">
                      <Button
                        size="sm"
                        variant="primary"
                        on:click={() => {
                          mixpanel.track('site:content-renewal:mark-suggestion');
                          markSuggestion(outdated.page.id, fix);
                        }}
                      >
                        <Icon icon={MessageSquarePlusIcon} size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip message="무시하기" placement="top-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        on:click={() => {
                          mixpanel.track('site:content-renewal:ignore-suggestion');
                          removeSuggestion(outdated.page.id, fix);
                        }}
                      >
                        <Icon icon={Trash2Icon} size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                <div
                  class={flex({
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '2px',
                    textStyle: '14r',
                    color: 'text.secondary',
                  })}
                >
                  <Icon style={css.raw({})} icon={InfoIcon} size={16} />
                  <span>{fix.reason}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    <div class={flex({ justifyContent: 'flex-end', marginTop: '16px', gap: '8px' })}>
      <Tooltip message="모든 수정 제안을 코멘트로 남기기" placement="top-end">
        <Button
          style={css.raw({ gap: '4px' })}
          variant="primary"
          on:click={() => {
            mixpanel.track('site:content-renewal:mark-all-suggestions');
            markAllSuggestions();
          }}
        >
          <Icon icon={MessageSquarePlusIcon} size={16} />
          <span>모두 마크하기</span>
        </Button>
      </Tooltip>
      <Tooltip message="모든 수정 제안을 무시하기" placement="top-end">
        <Button
          style={css.raw({ gap: '4px' })}
          variant="secondary"
          on:click={() => {
            mixpanel.track('site:content-renewal:ignore-all-suggestions');
            reset();
          }}
        >
          <Icon icon={Trash2Icon} size={16} />
          <span>모두 무시하기</span>
        </Button>
      </Tooltip>
    </div>
  {:else}
    <div
      class={flex({
        flexDirection: 'column',
        alignItems: 'start',
        gap: '24px',
        paddingX: '18px',
        paddingY: '24px',
        borderRadius: '8px',
        backgroundColor: 'neutral.10',
        borderWidth: '1px',
        borderColor: 'border.primary',
        color: 'text.secondary',
        textStyle: '16sb',
      })}
    >
      <div class={flex({ gap: '12px' })}>
        <AiIcon variant="gray" />
        <p>축하합니다! 최신화할 콘텐츠가 없습니다.</p>
      </div>

      <Button
        style={css.raw({ width: 'full' })}
        variant="secondary"
        on:click={() => {
          mixpanel.track('site:content-renewal:restart');
          reset();
        }}
      >
        다시 찾기
      </Button>
    </div>
  {/if}
</TitledModal>
