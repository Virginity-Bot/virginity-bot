import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';

@Module({
  imports: [forwardRef(() => DatabaseModule)],
  controllers: [PrometheusController],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class PrometheusModule {}
