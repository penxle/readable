import { createRawSnippet, mount } from 'svelte';
import Alert from './AlertBuilder.svelte';

type AlertOptions = {
  oncancel?: () => void;
  onaction: () => void;
  title: string;
  content: string;
  action?: string;
  cancel?: string;
  variant?: 'primary' | 'danger';
};

export function invokeAlert(options: AlertOptions) {
  return mount(Alert, {
    target: document.body,
    intro: true,
    props: {
      open: true,
      oncancel: options.oncancel,
      onaction: options.onaction,
      title: toSnippet(options.title),
      content: toSnippet(options.content),
      action: options.action ? toSnippet(options.action) : undefined,
      cancel: options.cancel ? toSnippet(options.cancel) : undefined,
      variant: options.variant,
    },
  });
}

const toSnippet = (value: string) => createRawSnippet(() => ({ render: () => value }));
