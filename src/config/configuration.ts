/* eslint no-process-env: "off" */
/* eslint no-console: "off" */

import { minutesToMilliseconds } from 'date-fns';
import {
  IsEnum,
  validate,
  IsInt,
  Min,
  Max,
  IsString,
  Matches,
} from 'class-validator';

// TODO: switch to using @nestjs/config

export enum LogLevel {
  QUIET,
  ERROR,
  WARN,
  DEBUG,
}

class Configuration {
  @IsEnum(LogLevel, {
    message: `$property must be one of QUIET, ERROR, WARN, DEBUG`,
  })
  log_level =
    process.env.LOG_LEVEL != null
      ? LogLevel[process.env.LOG_LEVEL]
      : LogLevel.WARN;

  db = {
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
    auto_migrate: (process.env.DATABASE_AUTO_MIGRATE ?? 'true') === 'true',
  };

  mikro_orm = {
    cache_dir: process.env.MIKRO_ORM_CACHE_DIR ?? `${process.cwd()}/temp`,
  };

  storage = {
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
  };

  @IsInt()
  @Min(1)
  @Max(65535)
  port = parseInt(process.env.PORT ?? '3000');

  @IsString()
  @Matches(/^\S+$/)
  discord_token = process.env.DISCORD_TOKEN as string;

  score = {
    reset_schedule: process.env.SCORE_RESET_SCHEDULE ?? '0 2 * * Tue',
  };

  audio = {
    default_intro: {
      path: 'assets/entrance_theme.opus',
      timeout_ms: minutesToMilliseconds(4.9),
    },
  };
}

const configuration = new Configuration();
validate(configuration)
  .then((errs) => {
    console.error(
      errs
        .map((err) =>
          err.constraints != null
            ? Object.values(err.constraints)
                .map((m) => `${m}.`)
                .join('\n')
            : `Check ${err.property}.`,
        )
        .join('\n'),
    );
    process.exit(1);
  })
  .catch((err) => console.error(err));

export default configuration;
