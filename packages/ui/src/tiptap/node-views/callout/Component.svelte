<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex, grid } from '@readable/styled-system/patterns';
  import { createFloatingActions } from '@readable/ui/actions';
  import { NodeView, NodeViewContentEditable } from '@readable/ui/tiptap';
  import HighVoltageIcon from '~icons/twemoji/high-voltage';
  import LightBulbIcon from '~icons/twemoji/light-bulb';
  import LoudspeakerIcon from '~icons/twemoji/loudspeaker';
  import PartyPopperIcon from '~icons/twemoji/party-popper';
  import PoliceCarLightIcon from '~icons/twemoji/police-car-light';
  import PushpinIcon from '~icons/twemoji/pushpin';
  import type { NodeViewProps } from '@readable/ui/tiptap';
  import type { Component } from 'svelte';

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

  const emojis: Record<string, Component> = {
    lightbulb: LightBulbIcon,
    loudspeaker: LoudspeakerIcon,
    pushpin: PushpinIcon,
    rotating_light: PoliceCarLightIcon,
    tada: PartyPopperIcon,
    zap: HighVoltageIcon,
  };
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
        {@const Emoji = emojis[node.attrs.emoji]}
        <Emoji class={css({ display: 'block', flex: 'none', size: '20px' })} />
      {/if}
    </svelte:element>

    {#if emojiPickerOpened}
      <div
        class={grid({
          columns: 3,
          gap: '6px',
          borderRadius: '4px',
          padding: '6px',
          backgroundColor: 'surface.primary',
          boxShadow: 'emphasize',
          zIndex: '50',
        })}
        use:floating
      >
        {#each Object.entries(emojis) as [emoji, Emoji] (emoji)}
          <button
            class={center({
              borderRadius: '2px',
              size: '28px',
              _pressed: {
                backgroundColor: 'gray.1000/8',
              },
              _hover: {
                backgroundColor: 'gray.1000/8',
              },
            })}
            aria-label={emoji}
            aria-pressed={emoji === node.attrs.emoji}
            onclick={() => {
              updateAttributes({ emoji });
              emojiPickerOpened = false;
            }}
            title={emoji}
            type="button"
          >
            <Emoji class={css({ display: 'block', flex: 'none', size: '20px' })} />
          </button>
        {/each}
      </div>
    {/if}
    <div class={css({ flexGrow: 1, paddingTop: '2px' })}>
      <NodeViewContentEditable />
    </div>
  </div>
</NodeView>
