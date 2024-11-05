import type { Action } from 'svelte/action';
import type { Writable } from 'svelte/store';

type Parameter = Writable<boolean>;

export const hover: Action<HTMLElement, Parameter> = (element, value: Parameter) => {
  const mouseenter = () => value.set(true);
  const mouseleave = () => value.set(false);

  element.addEventListener('mouseenter', mouseenter);
  element.addEventListener('mouseleave', mouseleave);

  return {
    destroy: () => {
      document.removeEventListener('mouseenter', mouseenter);
      document.removeEventListener('mouseleave', mouseleave);
    },
  };
};
