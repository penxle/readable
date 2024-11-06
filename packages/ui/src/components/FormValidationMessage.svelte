<script lang="ts">
  import { getFormContext } from '../forms';
  import type { Snippet } from 'svelte';

  type Props = {
    for: string;
    type?: 'error' | 'warning';
    children: Snippet<[{ message: string }]>;
  };

  let { for: errorFor, type = 'error', children }: Props = $props();

  const { form } = getFormContext();

  if (!form) {
    throw new Error('Validation must be used within a Form');
  }

  const store = $derived(type === 'error' ? form.errors : form.warnings);
  const message = $derived($store[errorFor]?.[0]);
</script>

{#if message}
  {@render children({ message })}
{/if}
