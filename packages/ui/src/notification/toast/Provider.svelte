<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';
  import { portal } from '../../actions';
  import { openedDialogs } from '../../components';
  import Item from './Item.svelte';
  import { store } from './store';
</script>

<div
  class={flex({
    direction: 'column',
    gap: '8px',
    position: 'fixed',
    zIndex: '100',
    bottom: '20px',
    paddingLeft: '20px',
    pointerEvents: 'none',
  })}
  use:portal={openedDialogs.at(-1)}
>
  {#each $store as toast (toast.id)}
    <Item {toast} />
  {/each}
</div>
