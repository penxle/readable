import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-upgrade';
import type { Action } from 'svelte/action';

export const scrollLock: Action<HTMLElement> = (element) => {
  $effect(() => {
    disableBodyScroll(element, {
      allowTouchMove: (el) => {
        while (el !== document.body) {
          if (el instanceof HTMLElement) {
            if (el.dataset.scrollLockIgnore !== undefined) return true;
            if (el.parentElement === null) return false;
            el = el.parentElement;
          } else {
            return false;
          }
        }

        return false;
      },
    });

    return () => {
      enableBodyScroll(element);
    };
  });
};
