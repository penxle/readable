<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { NodeView } from '@readable/ui/tiptap';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import ImageIcon from '~icons/lucide/image';
  import Trash2Icon from '~icons/lucide/trash-2';
  import { Button, Icon, Img, Menu, MenuItem, RingSpinner } from '../../../components';
  import Enlarge from './Enlarge.svelte';
  import type { NodeViewProps } from '@readable/ui/tiptap';

  type Props = NodeViewProps;

  let { node, editor, extension, selected, updateAttributes, deleteNode }: Props = $props();

  let inflight = $state(false);
  let pickerOpened = $state(false);

  $effect(() => {
    pickerOpened = selected;
  });

  let enlarged = $state(false);

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
    picker.accept = 'image/*';

    picker.addEventListener('change', async () => {
      pickerOpened = false;

      const file = picker.files?.[0];
      if (!file) {
        return;
      }

      inflight = true;
      try {
        const attrs = await extension.options.handleImageUpload(file);
        updateAttributes(attrs);
      } finally {
        inflight = false;
      }
    });

    picker.click();
  };

  let containerEl = $state<HTMLDivElement>();
  let proportion = $state(node.attrs.proportion);

  let initialResizeData: {
    x: number;
    width: number;
    proportion: number;
    reverse: boolean;
  } | null = null;

  const handleResizeStart = (event: PointerEvent, reverse: boolean) => {
    if (!containerEl) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    initialResizeData = {
      x: event.clientX,
      width: containerEl.clientWidth,
      proportion,
      reverse,
    };
  };

  const handleResize = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement;
    if (!target.hasPointerCapture(event.pointerId) || !initialResizeData) {
      return;
    }

    const dx = (event.clientX - initialResizeData.x) * (initialResizeData.reverse ? -1 : 1);
    const np = ((initialResizeData.width + dx * 2) / initialResizeData.width) * initialResizeData.proportion;

    proportion = Math.max(0.1, Math.min(1, np));
  };

  const handleResizeEnd = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement;
    target.releasePointerCapture(event.pointerId);
    updateAttributes({ proportion });
  };
</script>

<NodeView style={css.raw({ display: 'flex', justifyContent: 'center' })}>
  <div bind:this={containerEl} style:width={`${proportion * 100}%`} data-drag-handle draggable>
    {#if node.attrs.id}
      <div
        class={css({
          position: 'relative',
          width: 'full',
          _hover: { '& button': { display: 'flex' } },
        })}
        onclick={() => !editor?.isEditable && (enlarged = true)}
        role="presentation"
      >
        <Img
          style={css.raw({ width: 'full', borderRadius: '4px' }, !editor?.isEditable && { cursor: 'zoom-in' })}
          alt="본문 이미지"
          placeholder={node.attrs.placeholder}
          progressive
          ratio={node.attrs.ratio}
          size="full"
          url={node.attrs.url}
        />

        {#if editor?.isEditable}
          <button
            class={css({
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              color: 'neutral.0',
              backgroundColor: '[#363839/70]',
              size: '28px',
              _hover: { backgroundColor: '[#363839/40]' },
            })}
            onclick={() => deleteNode()}
            type="button"
          >
            <Icon icon={Trash2Icon} size={16} />
          </button>

          <div class={flex({ position: 'absolute', top: '0', bottom: '0', left: '10px', alignItems: 'center' })}>
            <button
              class={css({
                display: 'none',
                borderRadius: '4px',
                backgroundColor: '[#363839/70]',
                width: '8px',
                height: '1/3',
                maxHeight: '72px',
                cursor: 'col-resize',
                _hover: { backgroundColor: '[#363839/40]' },
              })}
              aria-label="이미지 크기 조절"
              onpointerdown={(event) => {
                event.preventDefault();
                handleResizeStart(event, true);
              }}
              onpointermove={handleResize}
              onpointerup={handleResizeEnd}
              type="button"
            ></button>
          </div>

          <div class={flex({ position: 'absolute', top: '0', bottom: '0', right: '10px', alignItems: 'center' })}>
            <button
              class={css({
                display: 'none',
                borderRadius: '4px',
                backgroundColor: '[#363839/70]',
                width: '8px',
                height: '1/3',
                maxHeight: '72px',
                cursor: 'col-resize',
                _hover: { backgroundColor: '[#363839/40]' },
              })}
              aria-label="이미지 크기 조절"
              onpointerdown={(event) => {
                event.preventDefault();
                handleResizeStart(event, false);
              }}
              onpointermove={handleResize}
              onpointerup={handleResizeEnd}
              type="button"
            ></button>
          </div>
        {/if}
      </div>
    {:else}
      <div
        class={css(
          {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '7px',
            borderWidth: '1px',
            borderColor: 'border.primary',
            borderRadius: '4px',
            width: 'full',
            backgroundColor: 'neutral.10',
            _hover: { '& > button > div': { display: 'flex' } },
          },
          pickerOpened && { backgroundColor: 'neutral.20' },
        )}
        use:anchor
      >
        <div
          class={flex({
            align: 'center',
            gap: '12px',
            paddingX: '14px',
            paddingY: '12px',
            textStyle: '14r',
            color: 'text.tertiary',
          })}
        >
          {#if inflight}
            <RingSpinner style={css.raw({ color: 'neutral.40', size: '20px' })} />
            이미지 업로드 중
          {:else}
            <Icon style={css.raw({ color: 'text.tertiary' })} icon={ImageIcon} size={20} />
            이미지 업로드
          {/if}
        </div>

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
      </div>
    {/if}
  </div>
</NodeView>

{#if pickerOpened && !node.attrs.id && !inflight && editor?.isEditable}
  <div
    class={flex({
      direction: 'column',
      align: 'center',
      borderWidth: '1px',
      borderColor: 'border.secondary',
      borderRadius: '10px',
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
      이미지 선택
    </Button>
  </div>
{/if}

{#if enlarged}
  <Enlarge {node} onclose={() => (enlarged = false)} referenceEl={containerEl} />
{/if}
