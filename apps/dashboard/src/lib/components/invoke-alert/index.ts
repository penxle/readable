import { mount } from 'svelte';
import Alert from './AlertBuilder.svelte';
import type { ComponentProps } from 'svelte';

export function invokeAlert(options: Omit<ComponentProps<typeof Alert>, 'open'>) {
  return mount(Alert, {
    target: document.body,
    intro: true,
    props: {
      open: true,
      ...options,
    },
  });
}
