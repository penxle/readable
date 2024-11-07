import './App.svelte';

import styles from './app.css?inline';

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
