<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import twitterEmojis from 'emoji-datasource-twitter/emoji.json';
  import { matchSorter } from 'match-sorter';
  import { tick } from 'svelte';
  import { HorizontalDivider } from '../../../components';
  import Emoji from './Emoji.svelte';

  type Props = {
    selectedEmoji: string;
    open: boolean;
    onselect: (emoji: string) => void;
  };

  let { selectedEmoji, open = $bindable(false), onselect }: Props = $props();

  const presetEmojiNames = ['exclamation', 'pushpin', 'bulb', 'loudspeaker', ''];

  const emojis = [
    ...twitterEmojis,
    {
      name: '',
      short_name: '',
      short_names: [''],
      has_img_twitter: true,
      sort_order: 0,
      sheet_x: -1,
      sheet_y: -1,
    },
  ]
    .filter((emoji) => emoji.has_img_twitter)
    .toSorted((a, b) => {
      if (presetEmojiNames.includes(a.short_name) && presetEmojiNames.includes(b.short_name)) {
        return presetEmojiNames.indexOf(a.short_name) - presetEmojiNames.indexOf(b.short_name);
      }

      if (presetEmojiNames.includes(a.short_name) && !presetEmojiNames.includes(b.short_name)) {
        return -1;
      }

      if (presetEmojiNames.includes(b.short_name) && !presetEmojiNames.includes(a.short_name)) {
        return 1;
      }

      return a.sort_order - b.sort_order;
    });

  let pickerEl = $state<HTMLDivElement>();
  let searchKeyword = $state('');

  const filteredEmojis = $derived(
    matchSorter(emojis, searchKeyword, {
      keys: ['name', 'short_name', 'short_names', 'text', 'texts'],
      sorter: (items) => items,
    }),
  );

  $effect(() => {
    tick().then(() => {
      pickerEl?.querySelector('[aria-pressed="true"]')?.scrollIntoView({
        block: 'center',
      });
    });
  });
</script>

<input class={css({ textStyle: '14m', padding: '6px' })} placeholder="검색..." type="text" bind:value={searchKeyword} />

<HorizontalDivider />

<div bind:this={pickerEl} class={flex({ gap: '6px', flexWrap: 'wrap', overflowY: 'auto' })}>
  {#each filteredEmojis as emoji (emoji.short_name)}
    <button
      class={flex({
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '2px',
        size: '28px',
        _pressed: {
          backgroundColor: 'gray.1000/8',
        },
        _hover: {
          backgroundColor: 'gray.1000/8',
        },
      })}
      aria-label={emoji.name}
      aria-pressed={emoji.short_name === selectedEmoji}
      onclick={() => {
        onselect(emoji.short_name);
        open = false;
      }}
      title={emoji.name}
      type="button"
    >
      <Emoji style={css.raw({ size: '20px' })} emoji={emoji.short_name} />
    </button>
  {/each}
</div>
