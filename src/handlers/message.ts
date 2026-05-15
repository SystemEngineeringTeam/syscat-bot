import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';

export const messageHandler: EventLazyHandler<'message', SlackAppEnv> = async ({ context, payload }: any) => {
  if (payload.subtype === 'bot_message') return;

  await context.client.chat.postMessage({
    channel: payload.channel,
    text: 'やあ！',
  });
};
