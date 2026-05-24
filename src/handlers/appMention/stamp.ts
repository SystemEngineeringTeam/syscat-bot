import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';
import { STAMP_REGEX } from '@/consts/regix';
import { sleepMs } from '@/utils/sleep';

export const appMentionStampCommandHandler = (commandPrams: string[]): EventLazyHandler<'app_mention', SlackAppEnv> => async ({ context, payload }) => {
  const action = commandPrams[1] === 'remove' ? 'remove' : 'add';
  const after = action === 'remove' ? commandPrams.slice(2).join(' ') : commandPrams.slice(1).join(' ');

  const matches = Array.from(after.matchAll(STAMP_REGEX));
  const stamps = matches.map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i);
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

  for (const stamp of stamps) {
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
    } finally {
      await sleepMs(100);
    }
  }
};
