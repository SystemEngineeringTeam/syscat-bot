import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';

export const emojiChanged: EventLazyHandler<'emoji_changed', SlackAppEnv> = async ({ env, context, payload }) => {
  const notifyChannelId = await env.SETTINGS_KV.get('notify_channel_id');

  if (!notifyChannelId) {
    console.warn('通知先チャンネルが設定されていません。');
    return;
  }

  await context.client.chat.postMessage({
    channel: notifyChannelId!,
    text: `新しい絵文字が追加されました！
#${payload.name}
${payload.value}`,
  });
};
