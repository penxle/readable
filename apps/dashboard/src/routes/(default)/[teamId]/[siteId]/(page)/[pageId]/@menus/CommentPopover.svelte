<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { Icon, Tooltip } from '@readable/ui/components';
  import dayjs from 'dayjs';
  import { createEventDispatcher, onMount } from 'svelte';
  import ArrowUpIcon from '~icons/lucide/arrow-up';
  import CircleCheckBigIcon from '~icons/lucide/circle-check-big';
  import { fragment, graphql } from '$graphql';
  import { Img } from '$lib/components';
  import type { Editor } from '@tiptap/core';
  import type { Editor_CommentPopover_pageContentComment } from '$graphql';

  export let anchor: HTMLElement;
  export let editor: Editor;
  export let pos: number;
  export let pageId: string;

  let _comments: Editor_CommentPopover_pageContentComment[];
  export { _comments as $comments };

  $: comments = fragment(
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

  const dispatch = createEventDispatcher<{ close: undefined }>();
  const { floating, anchor: reference } = createFloatingActions({
    placement: 'bottom-start',
    offset: 8,
  });

  let popoverEl: HTMLDivElement;
  let content = '';

  const onClickOutside = (e: MouseEvent) => {
    if (!popoverEl.contains(e.target as Node)) {
      dispatch('close');
    }
  };

  const onSubmit = async () => {
    const isFirstComment = $comments.length === 0;

    const node = editor.state.doc.nodeAt(pos);
    if (!node || !node.attrs.nodeId) {
      return;
    }

    await addPageContentComment({
      pageId,
      nodeId: node.attrs.nodeId,
      content,
    });

    content = '';

    if (isFirstComment) {
      dispatch('close');
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

    dispatch('close');
  };

  onMount(() => {
    reference(anchor);
  });
</script>

<svelte:window on:click|capture={onClickOutside} />

<div
  bind:this={popoverEl}
  class={flex({
    flexDirection: 'column',
    gap: '16px',
    borderRadius: '12px',
    paddingX: '16px',
    paddingY: '12px',
    width: '320px',
    maxHeight: '320px',
    backgroundColor: 'white',
    boxShadow: 'strong',
    zIndex: '50',
  })}
  use:floating
>
  {#if $comments.length > 0}
    <div class={flex({ align: 'center', justify: 'space-between' })}>
      <p class={css({ textStyle: '14sb' })}>댓글</p>

      <Tooltip message="해결하기" offset={6} placement="top">
        <button
          class={center({
            flex: 'none',
            marginRight: '-2px',
            borderRadius: '4px',
            size: '24px',
            color: 'text.tertiary',
            _hover: { backgroundColor: 'neutral.20' },
          })}
          type="button"
          on:click={onResolve}
        >
          <Icon icon={CircleCheckBigIcon} size={16} />
        </button>
      </Tooltip>
    </div>
  {/if}

  {#if $comments.length > 0}
    <ul class={flex({ flexGrow: '1', flexDirection: 'column', align: 'flex-start', gap: '12px', overflowY: 'auto' })}>
      {#each $comments as comment (comment.id)}
        <li class={flex({ align: 'flex-start', gap: '8px', width: 'full' })}>
          <Img
            style={css.raw({
              flex: 'none',
              marginTop: '3px',
              borderWidth: '1px',
              borderColor: 'border.image',
              borderRadius: 'full',
              size: '24px',
            })}
            $image={comment.user.avatar}
            alt={comment.user.name}
            size={24}
          />

          <div class={flex({ flexGrow: '1', flexDirection: 'column', gap: '4px' })}>
            <div class={flex({ align: 'center', gap: '4px' })}>
              <div class={css({ flexGrow: '1', textStyle: '13b' })}>{comment.user.name}</div>
              <div class={css({ textStyle: '12r', color: 'text.tertiary' })}>{dayjs(comment.createdAt).fromNow()}</div>
            </div>

            <div class={css({ textStyle: '14m', color: 'text.secondary' })}>{comment.content}</div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  <form class={flex({ gap: '8px' })} on:submit|preventDefault={onSubmit}>
    <input
      class={css({
        flexGrow: '1',
        borderWidth: '1px',
        borderRadius: '6px',
        paddingX: '12px',
        paddingY: '4px',
        textStyle: '14r',
        backgroundColor: { base: 'neutral.10', _hover: 'neutral.20', _focus: 'neutral.20' },
      })}
      placeholder="댓글을 추가해보세요"
      type="text"
      bind:value={content}
    />
    <button
      class={center({
        flex: 'none',
        borderRadius: 'full',
        size: '32px',
        color: 'white',
        backgroundColor: { base: 'accent.50', _hover: 'accent.40' },
      })}
      type="submit"
    >
      <Icon icon={ArrowUpIcon} size={16} />
    </button>
  </form>
</div>
