<script lang="ts">
  import type { FormAction } from '@felte/core';
  import type { Snippet } from 'svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';

  type Props = {
    form: FormAction;
    context: () => void;
    children: Snippet;
  } & HTMLFormAttributes;

  let { form, context, children, ...rest }: Props = $props();
  context();
</script>

<form use:form {...rest}>
  {@render children()}
</form>
