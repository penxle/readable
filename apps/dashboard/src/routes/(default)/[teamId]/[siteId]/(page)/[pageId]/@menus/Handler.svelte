<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
  import { fragment, graphql } from '$graphql';
  import Comment from './Comment.svelte';
  import CommentPopover from './CommentPopover.svelte';
  import Floating from './Floating.svelte';
  import VirtualElement from './VirtualElement.svelte';
  import type { Editor_CommentPopover_pageContentComment, Editor_MenuHandler_query } from '$graphql';

  export let editor: Editor;
  export let menuContainerEl: HTMLElement;
  let _query: Editor_MenuHandler_query;
  export { _query as $query };

  $: query = fragment(
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
      }
    `),
  );

  let pos: number | null = null;
  let commentOpen: { pos: number; anchor: HTMLElement } | null = null;

  $: commentNodeIds = new Set($query.page.comments.map((c) => c.nodeId));
  let commentsByPos = new Map<number, Editor_CommentPopover_pageContentComment[]>();

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

  $: {
    $query.page.comments;
    updateCommentsByPos();
  }

  onMount(() => {
    editor.on('update', updateCommentsByPos);

    return () => {
      editor.off('update', updateCommentsByPos);
    };
  });
</script>

<svelte:window on:pointermove={handlePointerMove} />

{#if pos !== null}
  <VirtualElement {editor} {menuContainerEl} {pos} transition>
    <Floating slot="left" {editor} {pos} />
    <svelte:fragment slot="right">
      {#if !commentsByPos.has(pos)}
        <Comment {pos} on:click={(e) => (commentOpen = e.detail)} />
      {/if}
    </svelte:fragment>
  </VirtualElement>
{/if}

{#each commentsByPos.entries() as [pos, comments], index (index)}
  <VirtualElement {editor} {menuContainerEl} {pos}>
    <Comment slot="right" commentCount={comments.length} {pos} on:click={(e) => (commentOpen = e.detail)} />
  </VirtualElement>
{/each}

{#if commentOpen !== null}
  <CommentPopover
    {editor}
    pageId={$query.page.id}
    {...commentOpen}
    $comments={commentsByPos.get(commentOpen.pos) ?? []}
    on:close={() => (commentOpen = null)}
  />
{/if}
