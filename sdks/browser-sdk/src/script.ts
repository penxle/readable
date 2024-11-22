import '@readable/lib/dayjs';

import mixpanel from 'mixpanel-browser';
import { mount } from 'svelte';
import App from './App.svelte';

mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
  api_host: 'https://t.rdbl.app',
  ignore_dnt: true,
  persistence: 'localStorage',
  persistence_name: 'rdbl_browser_sdk',
});

mixpanel.register({
  service: 'browser-sdk',
});

const siteId = (document.currentScript as HTMLScriptElement).dataset.siteId;
if (!siteId) {
  throw new Error('siteId is required');
}

mixpanel.register({
  site_id: siteId,
});

const dom = document.createElement('rdbl-widget');
const shadow = dom.attachShadow({ mode: 'open' });

mount(App, {
  target: shadow,
  props: {
    dom,
    siteId,
  },
});

document.body.append(dom);
