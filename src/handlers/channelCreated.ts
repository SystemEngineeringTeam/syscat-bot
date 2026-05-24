import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';

export const channelCreated: EventLazyHandler<'channel_created', SlackAppEnv> = async ({ env, context, payload }) => {
  const notifyChannelId = await env.SETTINGS_KV.get('notify_channel_id');

  if (!notifyChannelId) {
    console.warn('通知先チャンネルが設定されていません。');
    return;
  }

  await context.client.chat.postMessage({
    channel: notifyChannelId!,
    text: `チャンネル「${payload.channel.name}」が作成されました！\n<#${payload.channel.id}>`,
  });
};
