import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from '@/types';
import { SPACE_REGEX } from '@/consts/regix';
import { appMentionStampCommandHandler } from './stamp';

export const appMentionHandler: EventLazyHandler<'app_mention', SlackAppEnv> = async ({ payload, ...rest }) => {
  const command = payload.text.split(SPACE_REGEX).slice(1).at(0);
  if (!command) return;

  switch (command) {
    case 'stamp': {
      await appMentionStampCommandHandler({ payload, ...rest });
      return;
    }
    default:
      if (payload.user) {
        await rest.context.client.chat.postEphemeral({
          user: payload.user,
          channel: payload.channel,
          text: `やあ！`,
        });
      }
  }
};
