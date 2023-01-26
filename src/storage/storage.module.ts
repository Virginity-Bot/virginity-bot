import { Module } from '@nestjs/common';
import { S3Module } from '@lab08/nestjs-s3';

import configuration from 'src/config/configuration';
import { StorageService } from './storage.service';

@Module({
  imports: [
    S3Module.forRoot({
      endPoint: configuration.storage.s3.host,
      region: configuration.storage.s3.region,
      accessKeyId: configuration.storage.s3.access_key_id,
      secretAccessKey: configuration.storage.s3.secret_access_key,
    }),
  ],
  providers: [StorageService],
  exports: [S3Module, StorageService],
})
export class StorageModule {}
