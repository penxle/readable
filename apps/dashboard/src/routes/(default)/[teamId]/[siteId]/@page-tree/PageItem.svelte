<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Alert, Icon, Menu, MenuItem, VerticalDivider } from '@readable/ui/components';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import ChevronDownIcon from '~icons/lucide/chevron-down';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import CopyIcon from '~icons/lucide/copy';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import LinkIcon from '~icons/lucide/link';
  import PencilIcon from '~icons/lucide/pencil';
  import Trash2Icon from '~icons/lucide/trash-2';
  import TriangleAlertIcon from '~icons/lucide/triangle-alert';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { graphql } from '$graphql';
  import { editingCategoryId } from '$lib/svelte/stores/ui';
  import ModifyUrlModal from '../@modals/ModifyUrlModal.svelte';
  import { maxDepth } from './const';
  import PageList from './PageList.svelte';
  import type { ComponentProps } from 'svelte';
  import type { CategoryData, PageData } from './types';

  type $$Props = {
    depth: number;
    item: PageData | CategoryData;
    openState: Record<string, boolean>;
    onPointerDown: (e: PointerEvent, item: PageData | CategoryData) => void;
    registerNode: (node: HTMLElement, item: (PageData | CategoryData) & { depth: number }) => void;
  } & Omit<ComponentProps<PageList>, 'depth' | 'items' | 'openState' | 'parent'>;

  export let depth: number;
  export let item: PageData | CategoryData;
  export let openState: Record<string, boolean>;
  export let onPointerDown: (e: PointerEvent, item: PageData | CategoryData) => void;
  export let registerNode: (node: HTMLElement, item: (PageData | CategoryData) & { depth: number }) => void;
  export let getPageUrl: (page: PageData) => string;

  let deleteCategoryOpen = false;
  let deletePageOpen = false;
  let modifyUrlOpen = false;
  let elem: HTMLElement;

  $: editing = item.id === $editingCategoryId;
  let inputEl: HTMLInputElement;

  $: registerNode(elem, {
    ...item,
    depth,
  });

  let childrenListProps: ComponentProps<PageList>;
  $: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { item, onPointerDown, ...rest } = $$props as $$Props;

    childrenListProps = {
      ...rest,
      depth: depth + 1,
      items: item.__typename === 'Category' ? item.pages : (item.children ?? []),
      parent: item,
    };
  }

  const updateCategory = graphql(`
    mutation PageTree_UpdateCategory_Mutation($input: UpdateCategoryInput!) {
      updateCategory(input: $input) {
        id
        name
      }
    }
  `);

  const deleteCategory = graphql(`
    mutation PageTree_DeleteCategory_Mutation($input: DeleteCategoryInput!) {
      deleteCategory(input: $input) {
        id
      }
    }
  `);

  const deletePage = graphql(`
    mutation PageTree_DeletePage_Mutation($input: DeletePageInput!) {
      deletePage(input: $input) {
        id
      }
    }
  `);

  const duplicatePage = graphql(`
    mutation PageTree_DuplicatePage_Mutation($input: DuplicatePageInput!) {
      duplicatePage(input: $input) {
        id
      }
    }
  `);

  $: if (editing && inputEl) {
    if (item.__typename !== 'Page') inputEl.value = item.name;
    inputEl.select();
  }

  const completeCategoryEdit = async () => {
    if (inputEl && editing) {
      await updateCategory({ categoryId: item.id, name: inputEl.value });
      editingCategoryId.set(null);
      toast.success('카테고리 이름이 변경되었습니다');
      mixpanel.track('category:update');
      // FIXME: 에러 핸들링?
    }
  };
</script>

<li
  bind:this={elem}
  class="dnd-item"
  aria-expanded={openState[item.id] || item.__typename === 'Category' ? 'true' : 'false'}
  aria-selected={item.id === $page.params.pageId ? 'true' : 'false'}
  role="treeitem"
  on:pointerdown={(e) => onPointerDown(e, item)}
>
  <div
    class={cx(
      'dnd-item-body',
      'group',
      css(
        {
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
          gap: '2px',
          paddingRight: '4px',
          _hover: {
            backgroundColor: 'neutral.20',
          },
          '&:has(button.menu-button[aria-expanded=true])': {
            backgroundColor: 'neutral.20',
          },
          '&:has(a[aria-selected=true])': {
            backgroundColor: 'neutral.20',
            color: 'text.primary',
          },
        },
        item.__typename === 'Page' ? { height: '34px' } : { height: '30px' },
        depth === maxDepth ? { borderTopLeftRadius: '0', borderBottomLeftRadius: '0' } : { paddingLeft: '4px' },
      ),
    )}
  >
    {#if item.__typename === 'Page' && depth === maxDepth}
      <VerticalDivider
        style={css.raw({
          backgroundColor: 'neutral.30',
          marginRight: '14px',
          _groupHover: { backgroundColor: 'neutral.60' },
        })}
      />
    {/if}

    {#if item.__typename !== 'Category'}
      {#if depth < maxDepth}
        <button
          class={css({
            color: 'neutral.60',
            borderRadius: '4px',
            padding: '3px',
            _hover: {
              backgroundColor: 'neutral.30',
            },
          })}
          aria-expanded={openState[item.id] ? 'true' : 'false'}
          type="button"
          on:click={() => {
            openState[item.id] = !openState[item.id];
          }}
        >
          <Icon icon={openState[item.id] ? ChevronDownIcon : ChevronRightIcon} size={14} />
        </button>
      {/if}
    {/if}

    {#if item.__typename === 'Page'}
      <a
        class={flex({
          alignSelf: 'stretch',
          alignItems: 'center',
          gap: '4px',
          flex: '1',
          color: 'text.primary',
          width: 'full',
          truncate: true,
          textStyle: '15m',
          _selected: {
            color: 'text.primary',
            textStyle: '15b',
          },
        })}
        aria-selected={item.id === $page.params.pageId ? 'true' : 'false'}
        draggable="false"
        href={getPageUrl(item)}
        role="tab"
      >
        {#if item.state === 'DRAFT'}
          <div
            class={flex({
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              paddingX: '4px',
              paddingY: '2px',
              color: 'text.secondary',
              textStyle: '11b',
              backgroundColor: 'neutral.30',
            })}
          >
            미게시
          </div>
        {/if}
        <span
          class={css({
            truncate: true,
            flex: '1',
          })}
        >
          {item.title}
        </span>
        <Menu disableAutoUpdate offset={2} placement="bottom-start">
          <div
            slot="button"
            class={css(
              {
                display: 'none',
                _groupHover: {
                  display: 'block',
                },
                borderRadius: '4px',
                padding: '3px',
                color: 'neutral.60',
                _hover: {
                  backgroundColor: 'neutral.30',
                },
              },
              open && { display: 'block' },
            )}
            let:open
          >
            <Icon icon={EllipsisIcon} size={14} />
          </div>
          <MenuItem
            on:click={async () => {
              await duplicatePage({ pageId: item.id });
              mixpanel.track('page:duplicate', {
                via: 'sidebar',
              });
            }}
          >
            <Icon icon={CopyIcon} size={14} />
            <span>복제</span>
          </MenuItem>
          <MenuItem on:click={() => (modifyUrlOpen = true)}>
            <Icon icon={LinkIcon} size={14} />
            <span>URL 변경</span>
          </MenuItem>
          <MenuItem variant="danger" on:click={() => (deletePageOpen = true)}>
            <Icon icon={Trash2Icon} size={14} />
            <span>삭제</span>
          </MenuItem>
        </Menu>
      </a>
    {:else}
      <!-- 섹션 (카테고리) -->
      {#if editing}
        <input
          bind:this={inputEl}
          class={css({ paddingX: '8px', paddingY: '4px', textStyle: '14b', color: 'text.secondary', width: 'full' })}
          type="text"
          on:blur={completeCategoryEdit}
          on:keydown={(e) => {
            if (e.key === 'Escape') {
              editingCategoryId.set(null);
            }
            if (e.key === 'Enter' && !e.isComposing) {
              inputEl.blur();
            }
          }}
        />
      {:else}
        <div
          class={css({
            display: 'inline-block',
            paddingX: '8px',
            paddingY: '4px',
            textStyle: '14b',
            color: 'text.secondary',
            width: 'full',
            truncate: true,
          })}
        >
          {item.name}
        </div>
        <div
          class={flex({
            display: 'none',
            _groupHover: {
              display: 'flex',
            },
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Menu disableAutoUpdate placement="bottom-start">
            <button
              slot="button"
              class={css({
                display: 'none',
                _groupHover: {
                  display: 'block',
                },
                borderRadius: '4px',
                padding: '3px',
                color: 'neutral.60',
                _hover: {
                  backgroundColor: 'neutral.30',
                },
              })}
              type="button"
            >
              <Icon icon={EllipsisIcon} size={14} />
            </button>
            <MenuItem
              on:click={() => {
                editingCategoryId.set(item.id);
              }}
            >
              <Icon icon={PencilIcon} size={14} />
              <span>이름 변경</span>
            </MenuItem>
            <MenuItem on:click={() => (modifyUrlOpen = true)}>
              <Icon icon={LinkIcon} size={14} />
              <span>URL 변경</span>
            </MenuItem>
            <MenuItem variant="danger" on:click={() => (deleteCategoryOpen = true)}>
              <Icon icon={Trash2Icon} size={14} />
              <span>삭제</span>
            </MenuItem>
          </Menu>
        </div>
      {/if}
    {/if}
  </div>

  {#if (openState[item.id] && depth < maxDepth) || item.__typename === 'Category'}
    <PageList {...childrenListProps} />
  {/if}
</li>

{#if item.__typename !== 'Category'}
  <Alert
    onAction={async () => {
      await deletePage({ pageId: item.id });
      toast.success('페이지가 삭제되었습니다');
      mixpanel.track('page:delete', {
        via: 'sidebar',
      });

      if (item.id === $page.params.pageId) {
        await (item.parent?.id
          ? goto(`/${$page.params.teamId}/${$page.params.siteId}/${item.parent.id}`)
          : goto(`/${$page.params.teamId}/${$page.params.siteId}`));
      }
    }}
    bind:open={deletePageOpen}
  >
    <svelte:fragment slot="title">
      "{item.title}" 페이지를 삭제하시겠어요?
    </svelte:fragment>
    <svelte:fragment slot="content">삭제된 페이지는 복구할 수 없습니다</svelte:fragment>

    {#if item.recursiveChildCount > 0}
      <div
        class={flex({
          align: 'center',
          gap: '6px',
          marginTop: '16px',
          borderRadius: '8px',
          paddingX: '10px',
          paddingY: '8px',
          textStyle: '13m',
          color: 'text.danger',
          backgroundColor: 'danger.10',
        })}
      >
        <Icon icon={TriangleAlertIcon} />
        <p>{item.recursiveChildCount}개의 하위 페이지가 함께 삭제됩니다</p>
      </div>
    {/if}

    <svelte:fragment slot="action">삭제</svelte:fragment>
    <svelte:fragment slot="cancel">취소</svelte:fragment>
  </Alert>
{/if}

{#if item.__typename === 'Category'}
  <Alert
    onAction={async () => {
      await deleteCategory({ categoryId: item.id });
      toast.success('카테고리가 삭제되었습니다');
      mixpanel.track('category:delete');
    }}
    bind:open={deleteCategoryOpen}
  >
    <svelte:fragment slot="title">
      "{item.name}" 카테고리를 삭제하시겠어요?
    </svelte:fragment>
    <svelte:fragment slot="content">삭제된 카테고리와 페이지는 복구할 수 없습니다</svelte:fragment>

    {#if item.recursivePageCount > 0}
      <div
        class={flex({
          align: 'center',
          gap: '6px',
          marginTop: '16px',
          borderRadius: '8px',
          paddingX: '10px',
          paddingY: '8px',
          textStyle: '13m',
          color: 'text.danger',
          backgroundColor: 'danger.10',
        })}
      >
        <Icon icon={TriangleAlertIcon} />
        <p>{item.recursivePageCount}개의 하위 페이지가 함께 삭제됩니다</p>
      </div>
    {/if}

    <svelte:fragment slot="action">삭제</svelte:fragment>
    <svelte:fragment slot="cancel">취소</svelte:fragment>
  </Alert>
{/if}

<ModifyUrlModal entity={item} bind:open={modifyUrlOpen} />
