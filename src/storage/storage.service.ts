import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';

import configuration from 'src/config/configuration';
import { IntroSongEntity } from 'src/entities/intro-song.entity';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly minio: MinioService) {}

  async storeFile(
    extension: string | void,
    hash: string,
    buf: Buffer,
  ): Promise<string> {
    const object = await this.minio.client.putObject(
      configuration.storage.s3.bucket_name,
      `${hash}${extension != null ? `.${extension}` : ''}`,
      buf,
    );

    return `s3://${object.etag}`;
  }
}
