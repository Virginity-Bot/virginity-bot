import { Readable } from 'stream';
import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';

import configuration from 'src/config/configuration';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = configuration.storage.s3.bucket_name;

  constructor(private readonly minio: MinioService) {}

  async storeFile(
    extension: string | void,
    hash: string,
    buf: Buffer,
  ): Promise<string> {
    const object_name = `${hash}${extension != null ? `.${extension}` : ''}`;
    await this.minio.client.putObject(this.bucket, object_name, buf);

    return `s3://${this.bucket}/${object_name}`;
  }

  async getStream(object: string, bucket?: string): Promise<Readable> {
    return this.minio.client.getObject(bucket ?? this.bucket, object);
  }
}
