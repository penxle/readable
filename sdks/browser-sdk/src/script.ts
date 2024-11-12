import '@readable/lib/dayjs';
import './App.svelte';

import mixpanel from 'mixpanel-browser';
import styles from './app.css?inline';

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
dom.setAttribute('site-id', siteId);

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);
dom.shadowRoot?.adoptedStyleSheets.push(sheet);

document.body.append(dom);
