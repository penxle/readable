<script lang="ts">
  import { autoUpdate, computePosition, offset } from '@floating-ui/dom';
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { onDestroy, onMount } from 'svelte';
  import { Button, TextInput } from '../../../components';
  import type { VirtualElement } from '@floating-ui/dom';
  import type { Editor } from '@tiptap/core';

  type Props = {
    editor: Editor;
    from: number;
    to: number;
    referenceElement: Element | VirtualElement;
    currentLink: string | null;
    defaultLink?: string;
    onclose: () => void;
    handleLink: (url: string) => Promise<Record<string, unknown>>;
  };

  let { editor, from, to, referenceElement, currentLink, defaultLink = '', onclose, handleLink }: Props = $props();

  let linkDraft = $state('');
  let floatingElement = $state<HTMLElement>();
  let inputElement = $state<HTMLInputElement>();
  let cleanup: (() => void) | null = null;

  const addHttpScheme = (url: string) => {
    if (!url.includes('://')) {
      return `http://${url}`;
    }
    return url;
  };

  const loadLink = async (href: string) => {
    if (currentLink) {
      const resp = await handleLink(href);
      linkDraft = resp.url ? `${resp.host}${resp.url}` : href;
    } else {
      linkDraft = href;
    }
  };

  const updateLink = async () => {
    linkDraft = linkDraft.trim();
    linkDraft = addHttpScheme(linkDraft);

    const attrs = await handleLink(linkDraft);

    const { tr } = editor.view.state;
    tr.addMark(from, to, editor.schema.marks.link.create({ ...attrs }));
    editor.view.dispatch(tr);

    onclose();
  };

  const clickListener = (event: Event) => {
    if (!floatingElement?.contains(event.target as Node)) {
      onclose();
    }
  };

  onMount(() => {
    if (!floatingElement) {
      return;
    }

    cleanup = autoUpdate(referenceElement, floatingElement, async () => {
      if (!floatingElement) {
        return;
      }

      const { x, y } = await computePosition(referenceElement, floatingElement, {
        placement: 'bottom-start',
        middleware: [offset(4)],
      });

      floatingElement.style.left = `${x}px`;
      floatingElement.style.top = `${y}px`;
    });

    setTimeout(() => {
      inputElement?.focus();
    });

    setTimeout(() => {
      document.addEventListener('click', clickListener);
    });

    loadLink(defaultLink);
  });

  onDestroy(() => {
    cleanup?.();
    document.removeEventListener('click', clickListener);
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div
  bind:this={floatingElement}
  class={css({
    position: 'absolute',
    top: '0',
    left: '0',
  })}
>
  <form
    class={flex({
      width: '300px',
      backgroundColor: 'background.overlay',
      borderRadius: '10px',
      boxShadow: 'strong',
      gap: '4px',
      padding: '4px',
    })}
    onsubmit={(e) => {
      e.preventDefault();
      updateLink();
    }}
  >
    <!-- FIXME: 유효한 링크인지 검사? -->
    <TextInput
      name="link-draft"
      style={css.raw({
        flex: '1',
      })}
      placeholder="https://..."
      size="sm"
      bind:inputEl={inputElement}
      bind:value={linkDraft}
    />
    <Button disabled={linkDraft === ''} size="sm" type="submit" variant="primary">
      {#if !currentLink}
        확인
      {:else}
        수정
      {/if}
    </Button>
  </form>
</div>
