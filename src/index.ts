import type { ExecutionContext } from 'slack-cloudflare-workers';
import type { SlackAppEnv } from './types';

import { SlackApp } from 'slack-cloudflare-workers';
import { appMentionHandler } from './handlers/appMention';
import { channelCreated } from './handlers/channelCreated';
import { emojiChanged } from './handlers/emojiChanged';
import { messageHandler } from './handlers/message';
import { setNotifyChannel } from './handlers/setNotifyChannel';

export default {
  async fetch(
    request: Request,
    env: SlackAppEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp<SlackAppEnv>({ env });

    app.command('/set-notify-channel', setNotifyChannel);
    app.event('message', messageHandler);
    app.event('app_mention', appMentionHandler);
    app.event('channel_created', channelCreated);
    app.event('emoji_changed', emojiChanged);

    return await app.run(request, ctx);
  },
};
