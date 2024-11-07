<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { NodeView, NodeViewContentEditable } from '@readable/ui/tiptap';
  import Emoji from './Emoji.svelte';
  import type { NodeViewProps } from '@readable/ui/tiptap';

  type Props = NodeViewProps;

  let { node, editor, updateAttributes }: Props = $props();

  let emojiPickerOpened = $state(false);

  const { anchor, floating } = createFloatingActions({
    placement: 'bottom-end',
    offset: 8,
    onClickOutside: () => {
      emojiPickerOpened = false;
    },
  });
</script>

<NodeView>
  <div
    class={flex({
      gap: '7px',
      borderLeftWidth: '3px',
      borderColor: 'var(--usersite-theme-color)',
      backgroundColor: 'var(--usersite-theme-color)/4',
      paddingLeft: '14px',
      paddingRight: '16px',
      paddingY: '16px',
      borderRightRadius: '4px',
    })}
  >
    <svelte:element
      this={editor?.isEditable ? 'button' : 'div'}
      class={css(
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '2px',
          size: '28px',
          textStyle: '20m',
          _pressed: {
            backgroundColor: 'gray.1000/8',
          },
          _hover: {
            backgroundColor: 'gray.1000/8',
          },
        },
        !editor?.isEditable && { pointerEvents: 'none' },
      )}
      contenteditable={false}
      onclick={() => {
        if (editor) {
          emojiPickerOpened = true;
        }
      }}
      role={editor?.isEditable ? 'button' : 'img'}
      {...editor?.isEditable && {
        type: 'button',
        'aria-pressed': emojiPickerOpened,
      }}
      use:anchor
    >
      {#if node.attrs.emoji}
        <Emoji style={css.raw({ size: '20px' })} emoji={node.attrs.emoji} />
      {/if}
    </svelte:element>

    {#if emojiPickerOpened}
      <div
        class={flex({
          direction: 'column',
          gap: '6px',
          borderRadius: '4px',
          padding: '5px',
          backgroundColor: 'surface.primary',
          boxShadow: 'emphasize',
          width: '280px',
          height: '280px',
          zIndex: '50',
        })}
        use:floating
      >
        {#await import('./Picker.svelte') then { default: Picker }}
          <Picker
            onselect={(emoji) => updateAttributes({ emoji })}
            selectedEmoji={node.attrs.emoji}
            bind:open={emojiPickerOpened}
          />
        {/await}
      </div>
    {/if}
    <div class={css({ flexGrow: 1, paddingTop: '2px' })}>
      <NodeViewContentEditable />
    </div>
  </div>
</NodeView>
