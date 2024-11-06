import { Hono } from 'hono';
import { caddy } from './caddy';
import { healthz } from './healthz';
import { opengraph } from './opengraph';
import { widget } from './widget';

export const hono = new Hono();

hono.route('/caddy', caddy);
hono.route('/healthz', healthz);
hono.route('/opengraph', opengraph);
hono.route('/widget', widget);
