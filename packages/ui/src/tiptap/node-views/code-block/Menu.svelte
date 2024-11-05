<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { matchSorter } from 'match-sorter';
  import { bundledLanguagesInfo } from 'shiki';
  import IconCheck from '~icons/lucide/check';
  import IconChevronDown from '~icons/lucide/chevron-down';
  import IconChevronUp from '~icons/lucide/chevron-up';
  import IconSearch from '~icons/lucide/search';
  import { createFloatingActions } from '../../../actions';
  import { HorizontalDivider, Icon } from '../../../components';
  import type { NodeViewProps } from '../../lib';

  type Props = {
    open?: boolean;
    node: NodeViewProps['node'];
    updateAttributes: NodeViewProps['updateAttributes'];
  };

  let { open = $bindable(false), node, updateAttributes }: Props = $props();

  let query = $state('');
  let inputElem = $state<HTMLInputElement>();
  let buttonEl = $state<HTMLButtonElement>();
  let menuEl = $state<HTMLUListElement>();
  let selectedIndex = $state<number | null>(null);

  $effect(() => {
    if (open && inputElem) {
      inputElem.focus();
    }
  });

  const close = () => {
    open = false;
    query = '';
    buttonEl?.focus();
  };

  const { anchor, floating } = createFloatingActions({
    placement: 'bottom-end',
    offset: 4,
    onClickOutside: close,
  });

  const languages = [
    ...bundledLanguagesInfo.map((language) => ({ id: language.id, name: language.name, aliases: language.aliases })),
    { id: 'text', name: 'Plain Text', aliases: [] },
  ].toSorted((a, b) => a.name.localeCompare(b.name));

  let currentLanguage = $derived(languages.find((language) => language.id === node.attrs.language)?.name ?? '?');
  let filteredLanguages = $derived(
    matchSorter(languages, query, {
      keys: ['name', 'aliases'],
      sorter: (items) => items,
    }),
  );

  // FIXME: refactor
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (open) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'Tab') {
        close();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex !== null) {
          const language = filteredLanguages[selectedIndex];
          if (language) {
            updateAttributes({ language: language.id });
            close();
          }
        }
      }

      if (e.key === 'ArrowDown') {
        selectedIndex = Math.min(selectedIndex ?? -1, filteredLanguages.length - 2) + 1;
      } else if (e.key === 'ArrowUp') {
        selectedIndex = Math.max((selectedIndex ?? filteredLanguages.length) - 1, 0);
      }

      if (selectedIndex !== null) {
        const menuItems = menuEl?.querySelectorAll('button');
        if (!menuItems || menuItems.length === 0) {
          return;
        }
        menuItems[selectedIndex]?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
    } else {
      const focusInButton = buttonEl?.contains(target);
      if (focusInButton && e.key === 'ArrowDown') {
        e.preventDefault();
        open = true;
      }
    }
  };
</script>

<button
  bind:this={buttonEl}
  class={css({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    textStyle: '14sb',
    paddingLeft: '10px',
    paddingRight: '6px',
    paddingY: '2px',
    borderWidth: '1px',
    borderColor: 'transparent',
    borderRadius: '4px',
    visibility: open ? 'visible' : 'hidden',
    color: 'text.secondary',
    '[data-node-view]:hover &': {
      visibility: 'visible',
    },
    _hover: {
      backgroundColor: 'neutral.10',
      borderColor: 'border.secondary',
    },
  })}
  onclick={() => (open = true)}
  type="button"
  use:anchor
>
  {currentLanguage}

  {#if open}
    <Icon icon={IconChevronUp} />
  {:else}
    <Icon icon={IconChevronDown} />
  {/if}
</button>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
  <div
    class={flex({
      direction: 'column',
      position: 'relative',
      backgroundColor: 'surface.primary',
      borderRadius: '8px',
      maxHeight: '360px',
      overflowY: 'auto',
      scrollbar: 'hidden',
      zIndex: '50',
      boxShadow: 'strong',
    })}
    role="menu"
    use:floating
  >
    <div class={css({ padding: '8px', backgroundColor: 'surface.primary' })}>
      <label
        class={flex({
          align: 'center',
          gap: '8px',
          paddingY: '7px',
          paddingX: '10px',
          borderRadius: '4px',
          borderColor: 'border.secondary',
          borderWidth: '1px',
        })}
      >
        <Icon style={css.raw({})} icon={IconSearch} size={14} />
        <input
          bind:this={inputElem}
          class={css({ fontSize: '14px' })}
          placeholder="언어를 검색하세요"
          type="text"
          bind:value={query}
        />
      </label>
    </div>
    <HorizontalDivider />
    <ul bind:this={menuEl} class={css({ padding: '8px', flex: '1', overflowY: 'auto' })}>
      {#if filteredLanguages.length > 0}
        {#each filteredLanguages as language, index (language.id)}
          <li>
            <button
              class={flex({
                align: 'center',
                justify: 'space-between',
                gap: '4px',
                paddingX: '14px',
                paddingY: '6px',
                fontSize: '14px',
                width: 'full',
                borderRadius: '4px',
                backgroundColor: {
                  base: selectedIndex === index ? 'neutral.20' : 'transparent',
                  _hover: 'neutral.20',
                  _focus: 'neutral.20',
                  _selected: 'neutral.20',
                },
              })}
              aria-pressed={node.attrs.language === language.id}
              onclick={() => {
                updateAttributes({ language: language.id });
                open = false;
              }}
              onpointerover={() => (selectedIndex = index)}
              tabIndex={selectedIndex === index ? 0 : -1}
              type="button"
            >
              {language.name}

              {#if node.attrs.language === language.id}
                <Icon style={css.raw({ color: 'brand.400', '& *': { strokeWidth: '[2]' } })} icon={IconCheck} />
              {/if}
            </button>
          </li>
        {/each}
      {:else}
        <li>
          <div class={css({ padding: '8px', fontSize: '14px', color: 'neutral.50' })}>검색 결과가 없습니다</div>
        </li>
      {/if}
    </ul>
  </div>
{/if}
