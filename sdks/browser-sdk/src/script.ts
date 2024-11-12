import './App.svelte';

import Mixpanel from 'mixpanel-browser';
import styles from './app.css?inline';

Mixpanel.init(import.meta.env.DEV ? '70816f3a6b13fa5f4c0dad59690c00bc' : '9bce2be6e6c87eeaa28d9a1bc413e4d8', {
  api_host: 'https://t.rdbl.app',
  ignore_dnt: true,
  persistence: 'localStorage',
});

const siteId = (document.currentScript as HTMLScriptElement).dataset.siteId;
if (!siteId) {
  throw new Error('siteId is required');
}

const dom = document.createElement('rdbl-widget');
dom.setAttribute('site-id', siteId);

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);
dom.shadowRoot?.adoptedStyleSheets.push(sheet);

document.body.append(dom);
