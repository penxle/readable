<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { NodeView } from '@readable/ui/tiptap';
  import ArrowDownToLineIcon from '~icons/lucide/arrow-down-to-line';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import PaperclipIcon from '~icons/lucide/paperclip';
  import Trash2Icon from '~icons/lucide/trash-2';
  import { Button, Icon, Menu, MenuItem, RingSpinner, VerticalDivider } from '../../../components';
  import type { NodeViewProps } from '@readable/ui/tiptap';

  type Props = NodeViewProps;

  let { node, editor, extension, selected, updateAttributes, deleteNode }: Props = $props();

  let inflight = $state(false);
  let pickerOpened = $state(false);
  let file = $state<File>();

  $effect(() => {
    pickerOpened = selected;
  });

  const { anchor, floating } = createFloatingActions({
    placement: 'bottom',
    offset: 4,
    onClickOutside: () => {
      pickerOpened = false;
    },
  });

  const handleUpload = async () => {
    const picker = document.createElement('input');
    picker.type = 'file';

    picker.addEventListener('change', async () => {
      pickerOpened = false;

      file = picker.files?.[0];
      if (!file) {
        return;
      }

      inflight = true;
      try {
        const attrs = await extension.options.handleFileUpload(file);
        updateAttributes(attrs);
      } finally {
        inflight = false;
      }
    });

    picker.click();
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;

    while (bytes >= 1024 && index < units.length - 1) {
      bytes /= 1024;
      index++;
    }

    return `${Math.floor(bytes)}${units[index]}`;
  };
</script>

<NodeView data-drag-handle draggable>
  <div
    class={css(
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: '1px',
        borderColor: 'border.primary',
        borderRadius: '4px',
        backgroundColor: { base: 'neutral.10' },
        _hover: { '& > button > div': { display: 'flex' } },
      },
      pickerOpened && { backgroundColor: 'neutral.20' },
    )}
  >
    {#if node.attrs.id}
      <div
        class={css({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingX: '14px',
          paddingY: '12px',
          textStyle: '14r',
          truncate: true,
        })}
      >
        <Icon style={css.raw({ color: 'text.tertiary' })} icon={PaperclipIcon} size={20} />
        <span class={css({ truncate: true })}>{node.attrs.name}</span>
        <VerticalDivider style={css.raw({ height: '14px' })} color="secondary" />
        <span class={css({ color: 'text.tertiary' })}>{formatFileSize(node.attrs.size)}</span>
      </div>
    {:else}
      <div
        class={flex({
          align: 'center',
          gap: '12px',
          paddingX: '14px',
          paddingY: '12px',
          textStyle: '14r',
          color: 'text.tertiary',
          width: 'full',
        })}
        use:anchor
      >
        {#if inflight}
          <RingSpinner style={css.raw({ size: '20px', color: 'neutral.40' })} />
          {#if file}
            <span class={css({ truncate: true })}>{file.name}</span>
            <VerticalDivider style={css.raw({ height: '14px' })} color="secondary" />
            <span class={css({ color: 'text.tertiary' })}>{formatFileSize(file.size)}</span>
          {:else}
            파일 업로드 중...
          {/if}
        {:else}
          <Icon style={css.raw({ color: 'text.tertiary' })} icon={PaperclipIcon} size={20} />
          파일 업로드
        {/if}
      </div>
    {/if}

    {#if editor?.isEditable}
      <Menu>
        {#snippet button({ open })}
          <div
            class={css(
              {
                display: 'none',
                marginRight: '12px',
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
    {:else}
      <a
        class={css({
          marginRight: '12px',
          borderRadius: '4px',
          padding: '2px',
          color: 'text.tertiary',
          _hover: { backgroundColor: 'neutral.30' },
        })}
        aria-label={`${node.attrs.name} 파일 다운로드`}
        href={node.attrs.url}
      >
        <Icon icon={ArrowDownToLineIcon} size={20} />
      </a>
    {/if}
  </div>
</NodeView>

{#if pickerOpened && !node.attrs.id && !inflight && editor?.isEditable}
  <div
    class={flex({
      direction: 'column',
      align: 'center',
      justify: 'center',
      borderWidth: '1px',
      borderColor: 'border.secondary',
      borderRadius: '12px',
      padding: '12px',
      backgroundColor: 'surface.primary',
      width: '380px',
      boxShadow: 'heavy',
      zIndex: '1',
    })}
    use:floating
  >
    <span class={css({ textStyle: '13r', color: 'text.tertiary' })}>아래 버튼을 클릭해 파일을 선택하세요</span>
    <Button style={css.raw({ marginTop: '12px', width: 'full' })} onclick={handleUpload} size="sm" variant="secondary">
      파일 선택
    </Button>
  </div>
{/if}
