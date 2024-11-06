import { Hono } from 'hono';
import { caddy } from './caddy';
import { healthz } from './healthz';
import { opengraph } from './opengraph';

export const hono = new Hono();

hono.route('/caddy', caddy);
hono.route('/healthz', healthz);
hono.route('/opengraph', opengraph);
