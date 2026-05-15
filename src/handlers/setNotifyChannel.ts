import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';

export const setNotifyChannel: SlashCommandAckHandler<SlackAppEnv> = async ({ env, context, payload }) => {
  await env.SETTINGS_KV.put('notify_channel_id', payload.channel_id);
  await context.client.chat.postEphemeral({
    user: payload.user_id,
    channel: payload.channel_id,
    text: `このチャンネルを通知先に設定しました！`,
  });
};
