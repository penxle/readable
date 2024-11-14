<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { NodeView } from '@readable/ui/tiptap';
  import { onMount, tick } from 'svelte';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import FileUpIcon from '~icons/lucide/file-up';
  import Trash2Icon from '~icons/lucide/trash-2';
  import { Button, Icon, Menu, MenuItem, RingSpinner, TextInput } from '../../../components';
  import { addHttpScheme } from '../../../utils';
  import type { NodeViewProps } from '@readable/ui/tiptap';

  type Props = NodeViewProps;

  let { node, editor, extension, selected, updateAttributes, deleteNode }: Props = $props();

  let url = $state('');
  let inflight = $state(false);
  let pickerOpened = $state(false);
  let inputEl = $state<HTMLInputElement>();
  let embedContainerEl = $state<HTMLDivElement>();

  $effect(() => {
    pickerOpened = selected;
  });

  $effect(() => {
    if (pickerOpened) {
      tick().then(() => {
        inputEl?.focus();
      });
    }
  });

  const { anchor, floating } = createFloatingActions({
    placement: 'bottom',
    offset: 4,
    onClickOutside: () => {
      pickerOpened = false;
    },
  });

  const handleInsert = async () => {
    if (!url) {
      return;
    }

    inflight = true;
    try {
      // FIXME: client side validation 필요할듯 (isValidLinkStructure)
      const urlWithScheme = addHttpScheme(url);

      const attrs = await extension.options.handleEmbed(urlWithScheme, true);
      updateAttributes(attrs);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      inflight = false;
    }
  };

  onMount(() => {
    if (!document.querySelector('script#iframely-embed')) {
      const script = document.createElement('script');
      script.id = 'iframely-embed';
      script.async = true;
      script.src = 'https://cdn.iframe.ly/embed.js';
      document.head.append(script);
    }

    if (node.attrs.html && node.attrs.title) {
      const iframe = embedContainerEl?.querySelector('iframe');
      if (iframe) {
        iframe.setAttribute('title', node.attrs.title);
      }
    }
  });
</script>

<NodeView data-drag-handle draggable>
  <div
    class={css({
      position: 'relative',
      _hover: { '& > button': { display: 'flex' }, '& > button > div': { display: 'flex' } },
    })}
  >
    {#if node.attrs.id}
      {#if node.attrs.html}
        <div
          bind:this={embedContainerEl}
          class={css({ display: 'contents' }, editor?.isEditable && { pointerEvents: 'none' })}
        >
          {@html node.attrs.html}
        </div>
      {:else}
        <svelte:element
          this={editor?.isEditable ? 'div' : 'a'}
          class={flex({ borderWidth: '1px', borderColor: 'border.primary', borderRadius: '6px' })}
          {...!editor?.isEditable && { href: node.attrs.url, target: '_blank', rel: 'noopener noreferrer' }}
        >
          <div class={flex({ direction: 'column', grow: '1', paddingX: '16px', paddingY: '15px' })}>
            <p class={css({ marginBottom: '3px', textStyle: '14m', lineClamp: 1 })}>
              {node.attrs.title ?? '(제목 없음)'}
            </p>
            <p class={css({ textStyle: '12m', color: 'text.secondary', lineClamp: 2, whiteSpace: 'pre-wrap' })}>
              {node.attrs.description ?? ''}
            </p>
            <p class={css({ marginTop: 'auto', textStyle: '12m', lineClamp: 1 })}>{new URL(node.attrs.url).origin}</p>
          </div>
          {#if node.attrs.thumbnailUrl}
            <img
              class={css({
                borderTopRightRadius: '5px',
                borderBottomRightRadius: '5px',
                size: '118px',
                objectFit: 'cover',
              })}
              alt={node.attrs.title ?? '(제목 없음)'}
              src={node.attrs.thumbnailUrl}
            />
          {/if}
        </svelte:element>
      {/if}

      {#if editor?.isEditable}
        <button
          class={css(
            {
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              color: 'neutral.0',
              backgroundColor: '[#363839/70]',
              size: '28px',
              _hover: { backgroundColor: '[#363839/40]' },
            },
            !node.attrs.id && { top: '1/2', translate: 'auto', translateY: '-1/2' },
          )}
          onclick={() => deleteNode()}
          type="button"
        >
          <Icon icon={Trash2Icon} size={16} />
        </button>
      {/if}
    {:else}
      <div
        class={flex({
          align: 'center',
          gap: '12px',
          borderWidth: '1px',
          borderColor: 'border.primary',
          borderRadius: '4px',
          paddingX: '14px',
          paddingY: '12px',
          textStyle: '14r',
          color: 'text.tertiary',
          backgroundColor: 'neutral.10',
          width: 'full',
        })}
        use:anchor
      >
        {#if inflight}
          <RingSpinner style={css.raw({ size: '20px', color: 'neutral.40' })} />
          <p>임베드 중...</p>
        {:else}
          <Icon icon={FileUpIcon} size={20} />
          <p>링크 임베드</p>
        {/if}
      </div>

      <Menu style={css.raw({ position: 'absolute', top: '12px', right: '12px' })}>
        {#snippet button({ open })}
          <div
            class={css(
              {
                display: 'none',
                borderRadius: '4px',
                padding: '2px',
                color: 'text.tertiary',
                _hover: { backgroundColor: 'neutral.30' },
              },
              open && { display: 'flex' },
            )}
          >
            <Icon icon={EllipsisIcon} size={20} />
          </div>
        {/snippet}

        <MenuItem onclick={() => deleteNode()} variant="danger">
          <Icon icon={Trash2Icon} size={12} />
          <span>삭제</span>
        </MenuItem>
      </Menu>
    {/if}
  </div>
</NodeView>

{#if pickerOpened && !node.attrs.id && !inflight && editor?.isEditable}
  <form
    class={flex({
      direction: 'column',
      align: 'center',
      borderWidth: '1px',
      borderColor: 'border.secondary',
      borderRadius: '12px',
      padding: '12px',
      backgroundColor: 'surface.primary',
      width: '380px',
      boxShadow: 'heavy',
      zIndex: '1',
    })}
    onsubmit={(e) => {
      e.preventDefault();
      handleInsert();
    }}
    use:floating
  >
    <span class={css({ marginBottom: '12px', textStyle: '13r', color: 'text.tertiary' })}>
      Youtube, Google Drive, 일반 링크 등
      <br />
      다양한 콘텐츠를 임베드할 수 있어요
    </span>
    <TextInput
      name="url"
      style={css.raw({ textStyle: '14r', width: 'full', height: '[32px!]' })}
      placeholder="https://..."
      size="md"
      bind:value={url}
      bind:inputEl
    />
    <Button style={css.raw({ marginTop: '8px', width: 'full' })} size="sm" type="submit">확인</Button>
  </form>
{/if}
