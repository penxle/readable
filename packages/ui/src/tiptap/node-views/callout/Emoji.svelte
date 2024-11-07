<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import sheet from 'emoji-datasource-twitter/img/twitter/sheets-clean/64.png';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  const getEmoji = async (name: string) => {
    const { default: twitterEmojis } = await import('emoji-datasource-twitter/emoji.json');
    return twitterEmojis.find((e) => e.short_name === name || e.short_names.includes(name));
  };

  type Props = {
    emoji: string;
    style: SystemStyleObject;
  };

  let { emoji, style }: Props = $props();
</script>

{#await getEmoji(emoji) then emoji}
  {#if !emoji || (emoji.sheet_x === -1 && emoji.sheet_y === -1)}
    <div
      class={css(
        {
          flex: 'none',
          borderWidth: '[1.5px]',
          borderColor: 'neutral.30',
          borderStyle: 'dashed',
          borderRadius: '4px',
        },
        style,
      )}
    ></div>
  {:else}
    <div
      style:background-position-x={`${(emoji.sheet_x / 61) * 100}%`}
      style:background-position-y={`${(emoji.sheet_y / 61) * 100}%`}
      style:background-size="6100% 6100%"
      style:background-image={`url(${sheet})`}
      class={css({ flex: 'none', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }, style)}
    ></div>
  {/if}
{/await}
