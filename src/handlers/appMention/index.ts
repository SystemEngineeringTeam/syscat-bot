import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';
import { SPACE_REGEX } from '@/consts/regix';
import { appMentionAiResponseHandler } from './ai';
import { appMentionStampCommandHandler } from './stamp';

export const appMentionHandler: EventLazyHandler<'app_mention', SlackAppEnv> = async ({ payload, context, ...rest }) => {
  const parts = payload.text.split(SPACE_REGEX);

  // メンション部分以降の最初の単語をコマンドとして扱う
  const mentionedText = `<@${context.botUserId}>`;
  const mentionedIndex = parts.findIndex((part) => part.trim() === mentionedText);
  const command = parts.at(mentionedIndex + 1)?.toLowerCase();

  if (command === undefined) {
    await appMentionAiResponseHandler({ payload, context, ...rest }); // AI 応答
    return;
  }

  const commandParams = parts.slice(mentionedIndex + 1);

  switch (command) {
    case 'stamp': {
      await appMentionStampCommandHandler(commandParams)({ payload, context, ...rest });
      return;
    }
    default:
      await appMentionAiResponseHandler({ payload, context, ...rest }); // AI 応答
  };
};
