<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { NodeView } from '@readable/ui/tiptap';
  import ImageIcon from '~icons/lucide/image';
  import { Button, Icon, Img, RingSpinner } from '../../../components';
  import type { NodeViewProps } from '@readable/ui/tiptap';

  type Props = NodeViewProps;

  let { node, editor, extension, selected, updateAttributes }: Props = $props();

  let inflight = $state(false);
  let pickerOpened = $state(false);

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
</script>

<NodeView
  style={css.raw({ display: 'inline-flex', alignItems: 'center', verticalAlign: 'top' })}
  as="span"
  data-drag-handle
  draggable
>
  {#if node.attrs.id}
    <Img
      style={css.raw({ borderRadius: '2px', height: '[1lh]' })}
      alt="본문 이미지"
      placeholder={node.attrs.placeholder}
      ratio={node.attrs.ratio}
      size={1024}
      url={node.attrs.url}
    />
  {:else}
    <div
      class={css(
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '7px',
          borderWidth: '1px',
          borderColor: 'border.primary',
          borderRadius: '4px',
          backgroundColor: 'neutral.10',
          height: '[1lh]',
        },
        pickerOpened && { backgroundColor: 'neutral.20' },
      )}
      use:anchor
    >
      <div
        class={flex({
          align: 'center',
          gap: '4px',
          paddingX: '4px',
          textStyle: '13r',
          color: 'text.tertiary',
        })}
      >
        {#if inflight}
          <RingSpinner style={css.raw({ color: 'neutral.40', size: '16px' })} />
          이미지 업로드 중
        {:else}
          <Icon style={css.raw({ color: 'text.tertiary' })} icon={ImageIcon} size={16} />
          이미지 업로드
        {/if}
      </div>
    </div>
  {/if}
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
