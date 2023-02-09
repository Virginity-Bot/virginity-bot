/* eslint no-process-env: "off" */
/* eslint no-console: "off" */
/* eslint @typescript-eslint/no-non-null-assertion: 'off' */

import { minutesToMilliseconds } from 'date-fns';
import {
  IsEnum,
  validate,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  IsBoolean,
  IsFQDN,
  IsUrl,
  ValidationError,
  IsOptional,
} from 'class-validator';
import { red } from 'chalk';

export enum LogLevel {
  QUIET,
  ERROR,
  WARN,
  DEBUG,
}

class LokiConf {
  @IsOptional()
  @IsUrl({
    allow_query_components: false,
    allow_trailing_dot: false,
    allow_fragments: false,
    require_protocol: true,
    disallow_auth: true,
    protocols: ['http', 'https'],
  })
  origin = process.env.LOG_LOKI_ORIGIN!;
  @IsOptional()
  @IsString()
  username = process.env.LOG_LOKI_USERNAME;
  @IsOptional()
  @IsString()
  password = process.env.LOG_LOKI_PASSWORD;
}

class LogConf {
  @IsEnum(LogLevel, {
    message: `$property must be one of QUIET, ERROR, WARN, DEBUG`,
  })
  level: LogLevel =
    process.env.LOG_LEVEL != null
      ? LogLevel[process.env.LOG_LEVEL]
      : LogLevel.WARN;

  driver = new LokiConf();
}

class MikroORMConf {
  @IsString()
  cache_dir = process.env.MIKRO_ORM_CACHE_DIR ?? `${process.cwd()}/temp`;
}

class DBConfPool {
  @IsInt()
  @Min(1)
  min = parseInt(process.env.DATABASE_POOL_MIN ?? '1');
  @IsInt()
  @Min(1)
  max = parseInt(process.env.DATABASE_POOL_MAX ?? '5');
}

class DBConf {
  @IsString()
  type = (process.env.DATABASE_TYPE ?? 'postgresql') as
    | 'postgresql'
    | 'mongo'
    | 'mysql'
    | 'mariadb'
    | 'sqlite'
    | 'better-sqlite';
  @IsUrl()
  url = process.env.DATABASE_URL!;
  pool = new DBConfPool();
  @IsBoolean()
  auto_migrate = (process.env.DATABASE_AUTO_MIGRATE ?? 'true') === 'true';
}

class StorageConfS3 {
  @IsFQDN()
  host = process.env.STORAGE_S3_HOST!;
  @IsInt()
  @Min(1)
  @Max(65535)
  port = parseInt(process.env.STORAGE_S3_PORT!);
  @IsBoolean()
  ssl = (process.env.STORAGE_S3_SSL ?? 'true') === 'true';
  @IsString()
  region = process.env.STORAGE_S3_REGION!;
  @IsString()
  access_key_id = process.env.STORAGE_S3_ACCESS_KEY_ID!;
  @IsString()
  secret_access_key = process.env.STORAGE_S3_SECRET_ACCESS_KEY!;
  @IsString()
  bucket_name = process.env.STORAGE_S3_BUCKET_NAME ?? 'intro-songs';
}

class StorageConfAudio {
  @IsInt()
  max_file_size_b =
    parseFloat(process.env.STORAGE_AUDIO_MAX_FILE_SIZE_KiB ?? '1024') * 1024;
}

class StorageConf {
  s3 = new StorageConfS3();
  audio = new StorageConfAudio();
}

class AudioConfDefaultIntro {
  path = 'assets/entrance_theme.opus';
  timeout_ms = minutesToMilliseconds(4.9);
}

class AudioConfCustomIntro {
  max_dur_s = 30;
}

class AudioConf {
  default_intro = new AudioConfDefaultIntro();
  custom_intro = new AudioConfCustomIntro();
}

class Configuration {
  log = new LogConf();

  db = new DBConf();

  mikro_orm = new MikroORMConf();

  storage = new StorageConf();

  @IsInt()
  @Min(1)
  @Max(65535)
  port = parseInt(process.env.PORT ?? '3000');

  @IsString()
  @Matches(/^\S+$/)
  discord_token = process.env.DISCORD_TOKEN!;

  audio = new AudioConf();
}

const configuration = new Configuration();
validate(configuration)
  .then((err) => {
    if (err != null && Array.isArray(err) && err[0] != null) throw err;
  })
  .catch((err) => {
    if (Array.isArray(err) && err[0] instanceof ValidationError) {
      console.error(
        red(
          err
            .map((err) =>
              err.constraints != null
                ? Object.values(err.constraints)
                    .map((m) => `${m}.`)
                    .join('\n')
                : `Check ${err.property}.`,
            )
            .join('\n'),
        ),
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });

export default configuration;
