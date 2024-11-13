<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { Button, Icon, Tooltip } from '@readable/ui/components';
  import dayjs from 'dayjs';
  import { onMount, tick } from 'svelte';
  import ArrowUpIcon from '~icons/lucide/arrow-up';
  import CircleCheckBigIcon from '~icons/lucide/circle-check-big';
  import XIcon from '~icons/lucide/x';
  import { fragment, graphql } from '$graphql';
  import { Img } from '$lib/components';
  import type { Editor } from '@tiptap/core';
  import type { Editor_CommentPopover_me, Editor_CommentPopover_pageContentComment } from '$graphql';

  type Props = {
    anchor: HTMLElement;
    editor: Editor;
    pos: number;
    pageId: string;
    $me: Editor_CommentPopover_me;
    $comments: Editor_CommentPopover_pageContentComment[];
    onclose?: () => void;
  };

  let { anchor, editor, pos, pageId, $comments: _comments, $me: _me, onclose }: Props = $props();

  const me = fragment(
    _me,
    graphql(`
      fragment Editor_CommentPopover_me on User {
        id
        name

        avatar {
          id
          ...Img_image
        }
      }
    `),
  );

  const comments = fragment(
    _comments,
    graphql(`
      fragment Editor_CommentPopover_pageContentComment on PageContentComment {
        id
        content
        createdAt

        user {
          id
          name

          avatar {
            id
            ...Img_image
          }
        }
      }
    `),
  );

  const addPageContentComment = graphql(`
    mutation PagePage_AddPageContentComment_Mutation($input: AddPageContentCommentInput!) {
      addPageContentComment(input: $input) {
        id
      }
    }
  `);

  const resolvePageContentComments = graphql(`
    mutation PagePage_ResolvePageContentComments_Mutation($input: ResolvePageContentCommentsInput!) {
      resolvePageContentComments(input: $input)
    }
  `);

  const { floating, anchor: reference } = createFloatingActions({
    placement: 'bottom-start',
    offset: 8,
  });

  let popoverEl = $state<HTMLDivElement>();
  let textareaEl = $state<HTMLTextAreaElement>();
  let commentsEl = $state<HTMLUListElement>();
  let content = $state('');

  const lineHeightPx = $derived(
    Number.parseFloat(textareaEl?.computedStyleMap().get('line-height')?.toString() ?? '1.6') *
      Number.parseFloat(textareaEl?.computedStyleMap().get('font-size')?.toString() ?? '16'),
  );

  $effect(() => {
    content;

    if (!textareaEl) {
      return;
    }

    // textarea 높이 자동 조정
    textareaEl.style.height = 'auto';
    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
  });

  // 댓글 추가 시 스크롤 맨 아래로
  let lastCommentCount = $state($comments.length);
  $effect(() => {
    if ($comments.length > lastCommentCount && commentsEl) {
      commentsEl.scrollTo({ top: commentsEl.scrollHeight, behavior: 'smooth' });
    }

    lastCommentCount = $comments.length;
  });

  // enter로 submit, shift+enter로 개행
  function onKeydownInTextarea(e: KeyboardEvent) {
    if (e.isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }

      e.preventDefault();
      if (content && !isSubmitting) {
        onSubmit();
      }
    }
  }

  const onClickOutside = (e: MouseEvent) => {
    if (!popoverEl) {
      return;
    }

    if (!popoverEl.contains(e.target as Node)) {
      onclose?.();
    }
  };

  let isSubmitting = $state(false);
  const onSubmit = async () => {
    const isFirstComment = $comments.length === 0;

    const node = editor.state.doc.nodeAt(pos);
    if (!node || !node.attrs.nodeId) {
      return;
    }

    isSubmitting = true;

    await addPageContentComment({
      pageId,
      nodeId: node.attrs.nodeId,
      content,
    });

    isSubmitting = false;
    content = '';

    if (isFirstComment) {
      onclose?.();
    }
  };

  const onResolve = async () => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node || !node.attrs.nodeId) {
      return;
    }

    await resolvePageContentComments({
      pageId,
      nodeId: node.attrs.nodeId,
    });

    onclose?.();
  };

  onMount(() => {
    reference(anchor);
    tick().then(() => textareaEl?.focus());
  });
</script>

<svelte:window onclickcapture={onClickOutside} />

{#if $comments.length > 0}
  <div
    bind:this={popoverEl}
    class={flex({
      flexDirection: 'column',
      borderRadius: '8px',
      width: '320px',
      maxHeight: '320px',
      backgroundColor: 'white',
      boxShadow: 'strong',
      zIndex: '50',
    })}
    use:floating
  >
    <div
      class={flex({
        align: 'center',
        justify: 'space-between',
        paddingX: '16px',
        paddingY: '10px',
        borderBottomWidth: '1px',
        borderColor: 'divider.primary',
      })}
    >
      <p class={css({ textStyle: '14sb' })}>댓글 {$comments.length}</p>

      <div class={flex({ align: 'center', gap: '6px' })}>
        <Button
          style={flex.raw({
            gap: '6px',
            height: 'auto',
            paddingX: '8px',
            paddingY: '4px',
            textStyle: '13sb',
          })}
          onclick={onResolve}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Icon icon={CircleCheckBigIcon} size={14} />
          <span>해결하기</span>
        </Button>

        <Tooltip message="닫기" offset={6} placement="top">
          <button
            class={center({
              flex: 'none',
              borderRadius: '6px',
              size: '26px',
              color: 'neutral.50',
              _hover: { backgroundColor: 'neutral.20' },
            })}
            onclick={onclose}
            type="button"
          >
            <Icon icon={XIcon} size={16} />
          </button>
        </Tooltip>
      </div>
    </div>

    <ul
      bind:this={commentsEl}
      class={flex({
        flexGrow: '1',
        flexDirection: 'column',
        align: 'flex-start',
        overflowY: 'auto',
        paddingBottom: '8px',
      })}
    >
      {#each $comments as comment (comment.id)}
        <li
          class={flex({
            flexDirection: 'column',
            align: 'flex-start',
            gap: '10px',
            width: 'full',
            paddingX: '16px',
            paddingY: '12px',
          })}
        >
          <div class={flex({ alignItems: 'center', gap: '6px' })}>
            <Img
              style={css.raw({
                flex: 'none',
                marginTop: '3px',
                borderWidth: '1px',
                borderColor: 'border.image',
                borderRadius: 'full',
                size: '22px',
              })}
              $image={comment.user.avatar}
              alt={comment.user.name}
              size={24}
            />

            <div class={css({ textStyle: '14m' })}>{comment.user.name}</div>
            <div class={css({ textStyle: '12r', color: 'text.tertiary' })}>{dayjs(comment.createdAt).fromNow()}</div>
          </div>
          <div
            class={css({
              textStyle: '13r',
              wordBreak: 'break-all',
              whiteSpace: 'pre-line',
            })}
          >
            {comment.content}
          </div>
        </li>
      {/each}
    </ul>

    <form
      class={flex({
        paddingX: '16px',
        paddingBottom: '16px',
        alignItems: 'center',
        gap: '6px',
      })}
      onsubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label
        class={flex({
          flexGrow: '1',
          alignItems: 'flex-start',
          gap: '6px',
          borderWidth: '1px',
          borderRadius: '6px',
          paddingX: '8px',
          paddingY: '6px',
          textStyle: '14r',
          backgroundColor: { base: 'neutral.10', _hover: 'neutral.20', _focus: 'neutral.20' },
        })}
      >
        <Img
          style={css.raw({
            flex: 'none',
            size: '24px',
            borderWidth: '1px',
            borderColor: 'border.image',
            borderRadius: 'full',
          })}
          $image={$me.avatar}
          alt={$me.name}
          size={24}
        />
        <textarea
          bind:this={textareaEl}
          style:max-height={`${lineHeightPx * 8}px`}
          class={css({
            flexGrow: '1',
            borderRadius: '6px',
            paddingY: '2px',
            textStyle: '14m',
            height: 'auto',
            resize: 'none',
          })}
          onkeydown={onKeydownInTextarea}
          placeholder="댓글을 추가해보세요"
          rows={1}
          bind:value={content}
        ></textarea>
      </label>
      <button
        class={center({
          alignSelf: 'flex-end',
          marginBottom: '7px',
          flex: 'none',
          borderRadius: 'full',
          size: '22px',
          color: 'white',
          backgroundColor: { base: 'accent.60', _hover: 'accent.50', _disabled: 'neutral.40' },
        })}
        disabled={!content || isSubmitting}
        type="submit"
      >
        <Icon icon={ArrowUpIcon} size={16} />
      </button>
    </form>
  </div>
{:else}
  <div
    bind:this={popoverEl}
    class={flex({
      gap: '6px',
      borderRadius: '8px',
      paddingX: '10px',
      paddingY: '8px',
      width: '400px',
      backgroundColor: 'white',
      boxShadow: 'strong',
      zIndex: '50',
    })}
    use:floating
  >
    <Img
      style={css.raw({
        size: '24px',
        borderWidth: '1px',
        borderColor: 'border.image',
        borderRadius: 'full',
      })}
      $image={$me.avatar}
      alt={$me.name}
      size={24}
    />

    <form
      class={flex({
        flexGrow: '1',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6px',
      })}
      onsubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        bind:this={textareaEl}
        style:max-height={`${lineHeightPx * 8}px`}
        class={css({
          flexGrow: '1',
          borderRadius: '6px',
          paddingY: '2px',
          textStyle: '14m',
          resize: 'none',
        })}
        onkeydown={onKeydownInTextarea}
        placeholder="댓글을 추가해보세요"
        rows={1}
        bind:value={content}
      ></textarea>
      <button
        class={center({
          alignSelf: 'flex-end',
          flex: 'none',
          borderRadius: 'full',
          size: '22px',
          color: 'white',
          backgroundColor: { base: 'accent.60', _hover: 'accent.50', _disabled: 'neutral.40' },
        })}
        disabled={!content || isSubmitting}
        type="submit"
      >
        <Icon icon={ArrowUpIcon} size={16} />
      </button>
    </form>
  </div>
{/if}
