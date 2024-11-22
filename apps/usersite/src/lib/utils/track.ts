import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { getFingerprint } from './fingerprint';

type TrackParams = {
  siteId: string;
  kind: string;
  data?: unknown;
};

export const track = async ({ siteId, kind, data }: TrackParams) => {
  if (browser) {
    navigator.sendBeacon(
      `${env.PUBLIC_API_URL}/logs`,
      JSON.stringify({ siteId, kind, deviceId: await getFingerprint(), data }),
    );
  }
};
