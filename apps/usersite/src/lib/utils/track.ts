import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

type TrackParams = {
  siteId: string;
  kind: string;
  data?: unknown;
};

export const track = async ({ siteId, kind, data }: TrackParams) => {
  if (browser) {
    const { getFingerprint } = await import('$lib/utils/fingerprint');
    navigator.sendBeacon(
      `${env.PUBLIC_API_URL}/logs`,
      JSON.stringify({ siteId, kind, deviceId: await getFingerprint(), data }),
    );
  }
};
