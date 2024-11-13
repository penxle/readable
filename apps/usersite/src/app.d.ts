/* eslint-disable @typescript-eslint/consistent-type-definitions */

import 'unplugin-icons/types/svelte';

declare global {
  namespace App {
    interface Error {
      code: string;
    }

    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

declare module 'svelte' {
  type Context = {
    // see routes/+layout.svelte
    uiState: {
      mobileNavOpen: boolean;
      searchBarOpen: boolean;
      hasCmd: boolean;
    };
  };

  export function getContext<T>(key: T extends keyof Context ? T : never): Context[T];

  export function setContext<T>(key: T extends keyof Context ? T : never, context: Context[T]): void;

  export function getAllContexts(): Map<keyof Context, Context[keyof Context]>;
}
