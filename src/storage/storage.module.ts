import { Module } from '@nestjs/common';
import { MinioModule } from 'nestjs-minio-client';

import configuration from 'src/config/configuration';
import { DatabaseModule } from 'src/database/database.module';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MinioModule.register({
      endPoint: configuration.storage.s3.host,
      port: configuration.storage.s3.port,
      useSSL: configuration.storage.s3.ssl,
      region: configuration.storage.s3.region,
      accessKey: configuration.storage.s3.access_key_id,
      secretKey: configuration.storage.s3.secret_access_key,
    }),
    DatabaseModule,
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
