import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';
import { SPACE_REGEX } from '@/consts/regix';
import { askSyscatAi } from '@/lib/syscat_ai';

export const appMentionAiResponseHandler: EventLazyHandler<'app_mention', SlackAppEnv> = async ({ context, payload, env }) => {
  const slackUserId = payload.user;
  const message = payload.text.split(SPACE_REGEX).slice(1).join(' ');
  const threadTimestamp = payload.thread_ts;

  await askSyscatAi(message, slackUserId, {
    client: context.client,
    channel: payload.channel,
    threadTimestamp,
    env,
  });
};
