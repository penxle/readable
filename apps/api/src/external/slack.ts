import ky from 'ky';
import { env } from '@/env';

type MessageParams = {
  channel: string;
  username: string;
  message: string;
};

export const message = async ({ channel, username, message }: MessageParams) => {
  try {
    await ky.post(env.SLACK_WEBHOOK_URL, {
      json: {
        channel,
        username,
        text: message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
        ],
      },
    });
  } catch {
    /* empty */
  }
};
