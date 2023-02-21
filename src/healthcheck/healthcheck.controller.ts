import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

import { HealthcheckService } from './healthcheck.service';

@Controller('/health')
export class HealthcheckController {
  constructor(private readonly healthcheck: HealthcheckService) {}

  @Get()
  async health(): Promise<{ discord: boolean }> {
    const tests = { discord: this.healthcheck.checkDiscordWS() };

    if (Object.values(tests).some((v) => !v)) {
      throw new InternalServerErrorException(tests);
    } else {
      return tests;
    }
  }
}
