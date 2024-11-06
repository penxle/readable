import { getConnInfo } from 'hono/bun';
import IPAddr from 'ipaddr.js';
import * as R from 'remeda';
import type { Context } from 'hono';

export const getClientAddress = (c: Context) => {
  try {
    const cf = c.req.header('CloudFront-Viewer-Address');
    if (cf) {
      const [ip] = cf.split(/:\d+$/);
      return IPAddr.process(ip).toString();
    }

    const xff = c.req.header('X-Forwarded-For');
    if (xff) {
      const ip = R.pipe(
        xff,
        R.split(','),
        R.map((v) => v.trim()),
        R.filter((v) => IPAddr.isValid(v)),
        R.map((v) => IPAddr.process(v)),
        R.findLast((v) => v.range() !== 'private'),
      );

      if (ip) {
        return ip.toString();
      }
    }

    const ip = getConnInfo(c).remote.address;
    if (ip) {
      return IPAddr.process(ip).toString();
    }
  } catch {
    // pass
  }

  return '0.0.0.0';
};
