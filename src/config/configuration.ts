// TODO: switch to using @nestjs/config
import { config } from 'dotenv';

config();

// export default () => ({
export default {
  db: {
    type: (process.env.DATABASE_TYPE ?? 'postgresql') as any,
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN ?? '1'),
      max: parseInt(process.env.DATABASE_POOL_MAX ?? '5'),
    },
  },

  // TODO: WTF is this?
  bot: process.env.BOT,
  discord_token: process.env.DISCORD_TOKEN,
  // TODO: WTF is this?
  guild_id: process.env.GUILD_ID,
  // TODO: WTF is this?
  client_id: process.env.CLIENT_ID,
  // });
};
