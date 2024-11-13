<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
  import { fragment, graphql } from '$graphql';
  import Comment from './Comment.svelte';
  import CommentPopover from './CommentPopover.svelte';
  import Floating from './Floating.svelte';
  import VirtualElement from './VirtualElement.svelte';
  import type { Editor_CommentPopover_pageContentComment, Editor_MenuHandler_query } from '$graphql';

  type Props = {
    editor: Editor;
    $query: Editor_MenuHandler_query;
  };

  let { editor, $query: _query }: Props = $props();

  const query = fragment(
    _query,
    graphql(`
      fragment Editor_MenuHandler_query on Query {
        page(pageId: $pageId) {
          id

          comments {
            id
            nodeId
            ...Editor_CommentPopover_pageContentComment
          }
        }

        me @required {
          id

          ...Editor_CommentPopover_me
        }
      }
    `),
  );

  let pos = $state<number | null>(null);
  let commentOpen = $state<{ pos: number; anchor: HTMLElement } | null>(null);

  const commentNodeIds = $derived(new Set($query.page.comments.map((c) => c.nodeId)));
  let commentsByPos = $state(new Map<number, Editor_CommentPopover_pageContentComment[]>());

  const handlePointerMove = (event: PointerEvent) => {
    if (commentOpen !== null) {
      return;
    }

    const { clientX, clientY } = event;
    const posAtCoords = editor.view.posAtCoords({ left: clientX, top: clientY });

    if (posAtCoords) {
      if (posAtCoords.inside === -1) {
        pos = null;
      } else {
        const pos$ = editor.state.doc.resolve(posAtCoords.inside);
        pos = pos$.before(1);
      }
    } else {
      pos = null;
    }
  };

  const updateCommentsByPos = () => {
    const map = new Map<number, Editor_CommentPopover_pageContentComment[]>();

    editor.state.doc.descendants((node, pos) => {
      if (commentNodeIds.has(node.attrs.nodeId)) {
        const m = map.get(pos) ?? [];
        const comments = $query.page.comments.filter((c) => c.nodeId === node.attrs.nodeId);
        m.push(...comments);
        map.set(pos, m);
      }
    });

    commentsByPos = map;
  };

  $effect(() => {
    $query.page.comments;
    updateCommentsByPos();
  });

  onMount(() => {
    editor.on('update', updateCommentsByPos);

    return () => {
      editor?.off('update', updateCommentsByPos);
    };
  });
</script>

<svelte:window onpointermove={handlePointerMove} />

{#if pos !== null}
  <VirtualElement {editor} {pos} transition>
    {#snippet port({ pos })}
      <Floating {editor} {pos} />
    {/snippet}
    {#snippet starboard({ pos })}
      {#if !commentsByPos.has(pos)}
        <Comment onclick={(e) => (commentOpen = e)} {pos} />
      {/if}
    {/snippet}
  </VirtualElement>
{/if}

{#each commentsByPos.entries() as [pos, comments], index (index)}
  <VirtualElement {editor} {pos}>
    {#snippet starboard()}
      <Comment commentCount={comments.length} onclick={(e) => (commentOpen = e)} {pos} />
    {/snippet}
  </VirtualElement>
{/each}

{#if commentOpen !== null}
  <CommentPopover
    {editor}
    pageId={$query.page.id}
    {...commentOpen}
    $comments={commentsByPos.get(commentOpen.pos) ?? []}
    $me={$query.me}
    onclose={() => (commentOpen = null)}
  />
{/if}
