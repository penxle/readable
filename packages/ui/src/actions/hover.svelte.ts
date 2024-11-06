import { on } from 'svelte/events';
import type { Action } from 'svelte/action';
import type { Writable } from 'svelte/store';

type Parameter = Writable<boolean>;

export const hover: Action<HTMLElement, Parameter> = (element, value: Parameter) => {
  $effect(() => {
    const mouseenter = on(element, 'mouseenter', () => value.set(true));
    const mouseleave = on(element, 'mouseleave', () => value.set(false));

    return () => {
      mouseenter();
      mouseleave();
    };
  });
};
