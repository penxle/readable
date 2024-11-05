<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { NodeView, NodeViewContentEditable } from '@readable/ui/tiptap';
  import CircleAlertIcon from '~icons/lucide/circle-alert';
  import CircleCheckIcon from '~icons/lucide/circle-check';
  import InfoIcon from '~icons/lucide/info';
  import TriangleAlertIcon from '~icons/lucide/triangle-alert';
  import { Icon } from '../../../components';
  import type { NodeViewProps } from '@readable/ui/tiptap';

  type Props = NodeViewProps;

  let { node, editor, updateAttributes }: Props = $props();

  type HintType = keyof typeof HintMap;
  const HintTypes: HintType[] = ['info', 'success', 'warning', 'danger'];
  const HintMap = {
    info: { icon: InfoIcon, color: 'var(--prosemirror-color-blue)' },
    success: { icon: CircleCheckIcon, color: 'var(--prosemirror-color-green)' },
    warning: { icon: CircleAlertIcon, color: 'var(--prosemirror-color-orange)' },
    danger: { icon: TriangleAlertIcon, color: 'var(--prosemirror-color-red)' },
  };

  const icon = $derived(HintMap[node.attrs.type as HintType].icon);
  const color = $derived(HintMap[node.attrs.type as HintType].color);
</script>

<NodeView>
  <div
    style:border-color={color}
    style:background-color={`color-mix(in srgb, ${color} 4%, transparent)`}
    class={flex({
      gap: '7px',
      borderLeftWidth: '3px',
      paddingLeft: '14px',
      paddingRight: '16px',
      paddingY: '16px',
      borderRightRadius: '4px',
    })}
  >
    <svelte:element
      this={editor?.isEditable ? 'button' : 'div'}
      style:color
      class={css(
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '2px',
          size: '28px',
          _hover: {
            backgroundColor: 'gray.1000/8',
          },
        },
        !editor?.isEditable && { pointerEvents: 'none' },
      )}
      contenteditable={false}
      onclick={() => {
        const type = HintTypes[(HintTypes.indexOf(node.attrs.type) + 1) % HintTypes.length];
        updateAttributes({ type });
      }}
      role={editor?.isEditable ? 'button' : 'img'}
      {...editor?.isEditable && {
        type: 'button',
      }}
    >
      <Icon {icon} size={20} />
    </svelte:element>

    <div class={css({ flexGrow: 1, paddingTop: '2px' })}>
      <NodeViewContentEditable />
    </div>
  </div>
</NodeView>
