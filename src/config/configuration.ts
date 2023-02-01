/* eslint no-process-env: "off" */

import { minutesToMilliseconds } from 'date-fns';

// TODO: switch to using @nestjs/config

export enum LogLevel {
  QUIET,
  ERROR,
  WARN,
  DEBUG,
}

const configuration = {
  log_level:
    process.env.LOG_LEVEL != null
      ? LogLevel[process.env.LOG_LEVEL]
      : LogLevel.WARN,

  db: {
    type: (process.env.DATABASE_TYPE ?? 'postgresql') as
      | 'postgresql'
      | 'mongo'
      | 'mysql'
      | 'mariadb'
      | 'sqlite'
      | 'better-sqlite',
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN ?? '1'),
      max: parseInt(process.env.DATABASE_POOL_MAX ?? '5'),
    },
  },

  mikro_orm: {
    cache_dir: process.env.MIKRO_ORM_CACHE_DIR ?? `${process.cwd()}/temp`,
  },

  storage: {
    s3: {
      host: process.env.STORAGE_S3_HOST as string,
      port: parseInt(process.env.STORAGE_S3_PORT as string),
      ssl: (process.env.STORAGE_S3_SSL ?? 'true') === 'true',
      region: process.env.STORAGE_S3_REGION as string,
      access_key_id: process.env.STORAGE_S3_ACCESS_KEY_ID as string,
      secret_access_key: process.env.STORAGE_S3_SECRET_ACCESS_KEY as string,
      bucket_name: process.env.STORAGE_S3_BUCKET_NAME ?? 'intro-songs',
    },

    audio: {
      max_file_size_b:
        parseFloat(process.env.STORAGE_AUDIO_MAX_FILE_SIZE_KiB ?? '1024') *
        1024,
    },
  },

  port: parseInt(process.env.PORT ?? '3000'),

  discord_token: process.env.DISCORD_TOKEN as string,

  score: {
    reset_schedule: process.env.SCORE_RESET_SCHEDULE ?? '0 2 * * Tue',
  },

  audio: {
    default_intro: {
      path: 'assets/entrance_theme.opus',
      timeout_ms: minutesToMilliseconds(4.9),
    },
  },
};

export default configuration;
