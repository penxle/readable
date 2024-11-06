import type { Action } from 'svelte/action';

type Parameter = HTMLElement | string | undefined;

export const portal: Action<HTMLElement, Parameter> = (element, target: Parameter = 'body') => {
  $effect(() => {
    let targetElement: HTMLElement | null;

    if (typeof target === 'string') {
      targetElement = document.querySelector(target);
      if (targetElement === null) {
        throw new Error(`No element found matching css selector: "${target}"`);
      }
    } else {
      targetElement = target;
    }

    targetElement.append(element);

    return () => {
      element.remove();
    };
  });
};
