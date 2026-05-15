import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';

const SPACE_REGEX = /\s+/;
const STAMP_REGEX = /:([^:\s]+):/g;

export const appMentionHandler: EventLazyHandler<'app_mention', SlackAppEnv> = async ({ context, payload }) => {
  const parts = payload.text.split(SPACE_REGEX).slice(1); // after mention
  if (parts[0] !== 'stamp') return;

  const action = parts[1] === 'remove' ? 'remove' : 'add';
  const after = action === 'remove' ? parts.slice(2).join(' ') : parts.slice(1).join(' ');

  const matches = Array.from(after.matchAll(STAMP_REGEX));
  const stamps = matches.map((m) => m[1]);
  const targetTs = payload.thread_ts ?? payload.ts;

  if (stamps.length === 0) {
    if (payload.user) {
      await context.client.chat.postEphemeral({
        channel: payload.channel,
        user: payload.user,
        thread_ts: targetTs,
        text: `@シスにゃんBOT stamp [スタンプ名] or @シスにゃんBOT stamp remove [スタンプ名] でスタンプを追加・削除できます！\n  例: @シスにゃんBOT stamp :penguin: :tada:\n  例: @シスにゃんBOT stamp remove :penguin: :tada:`,
      });
    }
    return;
  }

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
};
