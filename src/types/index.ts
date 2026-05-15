import type { SlackEdgeAppEnv } from 'slack-cloudflare-workers';

export type SlackAppEnv = SlackEdgeAppEnv & CloudflareBindings;
