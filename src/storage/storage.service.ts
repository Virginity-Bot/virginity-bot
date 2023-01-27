import { Injectable, Logger } from '@nestjs/common';
import { BucketsService } from '@lab08/nestjs-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly buckets: BucketsService) {
  }
}
