import type {
  ExecutionContext,
  SlackEdgeAppEnv,
} from 'slack-cloudflare-workers';
import { SlackApp } from 'slack-cloudflare-workers';

export default {
  async fetch(
    request: Request,
    env: SlackEdgeAppEnv & CloudflareBindings,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp<SlackEdgeAppEnv & CloudflareBindings>({ env });

    app.command('/set-notify-channel', async ({ env, context, payload }) => {
      await env.SETTINGS_KV.put('notify_channel_id', payload.channel_id);
      await context.client.chat.postEphemeral({
        user: payload.user_id,
        channel: payload.channel_id,
        text: `このチャンネルを通知先に設定しました！`,
      });
    });

    app.event('message', async ({ context, payload }) => {
      if (payload.subtype === 'bot_message') return;

      await context.client.chat.postMessage({
        channel: payload.channel,
        text: 'やあ！',
      });
    });

    app.event('channel_created', async ({ env, context, payload }) => {
      const notifyChannelId = await env.SETTINGS_KV.get('notify_channel_id');

      if (!notifyChannelId) {
        console.warn('通知先チャンネルが設定されていません。');
        return;
      }

      await context.client.chat.postMessage({
        channel: notifyChannelId!,
        text: `チャンネル「${payload.channel.name}」が作成されました！`,
      });
    });

    app.event('emoji_changed', async ({ env, context, payload }) => {
      const notifyChannelId = await env.SETTINGS_KV.get('notify_channel_id');

      if (!notifyChannelId) {
        console.warn('通知先チャンネルが設定されていません。');
        return;
      }

      await context.client.chat.postMessage({
        channel: notifyChannelId!,
        text: `新しい絵文字が追加されました！\n#${payload.name}\n${payload.value}`,
      });
    });

    return await app.run(request, ctx);
  },
};
