<script lang="ts">
  import { document } from 'zeed-dom';
  import type { DOMOutputSpec } from '@tiptap/pm/model';
  import type { VElement } from 'zeed-dom';

  type Props = {
    domOutputSpec: DOMOutputSpec;
    [key: string]: unknown;
  };

  let { domOutputSpec, ...rest }: Props = $props();

  const element = $derived.by(() => createElementFromSpec(domOutputSpec));

  function createElementFromSpec(spec: DOMOutputSpec): VElement {
    const [tag, attrs, ...children] = spec as [string, Record<string, string>, ...DOMOutputSpec[]];
    const el = document.createElement(tag as string);

    if (attrs && typeof attrs === 'object') {
      for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value as string);
      }
    }

    for (const child of children) {
      if (typeof child === 'string') {
        el.append(document.createTextNode(child));
      } else {
        el.append(createElementFromSpec(child as DOMOutputSpec));
      }
    }

    return el;
  }
</script>

<svelte:element this={element.tagName} {...element.attributes} {...rest}>
  {@html element.innerHTML}
</svelte:element>
