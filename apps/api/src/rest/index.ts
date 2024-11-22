import { Hono } from 'hono';
import { caddy } from './caddy';
import { healthz } from './healthz';
import { logs } from './logs';
import { opengraph } from './opengraph';

export const hono = new Hono();

hono.route('/caddy', caddy);
hono.route('/healthz', healthz);
hono.route('/logs', logs);
hono.route('/opengraph', opengraph);
