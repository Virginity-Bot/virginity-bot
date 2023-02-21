import { Module } from '@nestjs/common';

import { BotModule } from 'src/bot/bot.module';
import { HealthcheckController } from './healthcheck.controller';
import { HealthcheckService } from './healthcheck.service';

@Module({
  imports: [BotModule],
  controllers: [HealthcheckController],
  providers: [HealthcheckService],
  exports: [HealthcheckService],
})
export class HealthcheckModule {}
