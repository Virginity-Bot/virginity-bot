import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';

import configuration from 'src/config/configuration';
import { IntroSongEntity } from 'src/entities/intro-song.entity';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly minio: MinioService) {}

  async storeFile(name: string, buf: Buffer): Promise<IntroSongEntity> {
    const extension = name.split('.').at(-1);
    const hash = await createHash('sha256').update(buf).digest('base64url');

    const object = await this.minio.client.putObject(
      configuration.storage.s3.bucket_name,
      `${hash}${extension != null ? `.${extension}` : ''}`,
      buf,
    );

    return {
      hash,
      name,
      uri: `s3://${object.etag}` ?? '',
    } as IntroSongEntity;
  }
}
