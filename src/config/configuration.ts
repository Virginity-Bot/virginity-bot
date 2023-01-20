// TODO: switch to using @nestjs/config
import { ColorResolvable } from 'discord.js';
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

  port: parseInt(process.env.PORT ?? '3000'),

  // TODO: WTF is this?
  bot: process.env.BOT,
  discord_token: process.env.DISCORD_TOKEN,

  score: {
    multiplier: {
      screen: parseFloat(process.env.SCORE_MULTIPLIER_SCREEN ?? '1.5'),
      camera: parseFloat(process.env.SCORE_MULTIPLIER_CAMERA ?? '1.5'),
    },
  },

  role: {
    name: process.env.ROLE_NAME ?? 'Chonkiest Virgin the World Has Ever Seen',
    color: (process.env.ROLE_COLOR ?? '#DA8C80') as ColorResolvable,
    emoji: process.env.ROLE_EMOJI ?? '👑',
  },
};
