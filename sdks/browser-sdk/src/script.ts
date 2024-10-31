import './App.svelte';

import styles from './app.css?inline';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const dom = document.createElement('rdbl-widget');
dom.shadowRoot?.adoptedStyleSheets.push(sheet);

document.body.append(dom);
