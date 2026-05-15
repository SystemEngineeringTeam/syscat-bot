import type {
  ExecutionContext,
  SlackEdgeAppEnv,
} from 'slack-cloudflare-workers';
import { SlackApp } from 'slack-cloudflare-workers';

const SPACE_REGEX = /\s+/;
const STAMP_REGEX = /:([^:\s]+):/g;

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

    app.event('app_mention', async ({ context, payload }) => {
      const parts = payload.text.split(SPACE_REGEX).slice(1); // after mention
      if (parts[0] !== 'stamp') return;

      // determine action: add (default) or remove
      const action = parts[1] === 'remove' ? 'remove' : 'add';
      const after = action === 'remove' ? parts.slice(2).join(' ') : parts.slice(1).join(' ');

      const matches = Array.from(after.matchAll(STAMP_REGEX));
      const stamps = matches.map((m) => m[1]);

      if (stamps.length === 0) {
        await context.client.chat.postMessage({
          channel: payload.channel,
          text: action === 'remove' ? `<@${payload.user}> 削除するスタンプを指定してください。` : `<@${payload.user}> スタンプを指定してください。`,
        });
        return;
      }

      const targetTs = payload.thread_ts ?? payload.ts;
      for (const stamp of stamps.slice(0, 20)) {
        try {
          if (action === 'remove') {
            await context.client.reactions.remove({
              name: stamp,
              channel: payload.channel,
              timestamp: targetTs,
            });
          } else {
            await context.client.reactions.add({
              name: stamp,
              channel: payload.channel,
              timestamp: targetTs,
            });
          }
        } catch (err) {
          console.warn(`reactions.${action} failed`, stamp, err);
        }
      }

      if (payload.user) {
        await context.client.chat.postEphemeral({
          channel: payload.channel,
          user: payload.user,
          thread_ts: targetTs,
          text: `<@${payload.user}> スタンプを${action === 'remove' ? '削除' : '追加'}しました！${stamps.map((s) => ` :${s}: `).join('')}`,
        });
      }
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
