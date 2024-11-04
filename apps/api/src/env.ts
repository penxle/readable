import { z } from 'zod';

const schema = z.object({
  ACCESS_TOKEN_JWK: z.string(),
  DATABASE_URL: z.string(),
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
  IFRAMELY_API_KEY: z.string(),
  MEILISEARCH_API_KEY: z.string(),
  MEILISEARCH_URL: z.string(),
  PORTONE_API_KEY: z.string(),
  PORTONE_CHANNEL_KEY: z.string(),
  PUBLIC_DASHBOARD_URL: z.string(),
  PUBLIC_PULUMI_PROJECT: z.string().optional(),
  PUBLIC_PULUMI_STACK: z.string().optional(),
  PUBLIC_USERCONTENTS_URL: z.string(),
  PUBLIC_WEBSITE_URL: z.string(),
  REDIS_URL: z.string(),
  SENTRY_DSN: z.string().optional(),
  SLACK_FEEDBACK_WEBHOOK_URL: z.string(),
  USERSITE_CNAME_HOST: z.string(),
  USERSITE_DEFAULT_HOST: z.string(),
  USERSITE_FORCE_HOST: z.string().optional(),
});

export const env = schema.parse(process.env);
export const dev = process.env.NODE_ENV !== 'production';
export const production = process.env.PUBLIC_PULUMI_STACK
  ? process.env.PUBLIC_PULUMI_STACK === 'prod'
  : process.env.DOPPLER_ENVIRONMENT === 'prod';
