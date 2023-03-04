import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

import { HealthcheckService } from './healthcheck.service';

@Controller('/health')
export class HealthcheckController {
  constructor(private readonly healthcheck: HealthcheckService) {}

  @Get()
  async health(): Promise<UptimeResponse> {
    const tests: UptimeResponse = {
      discord: {
        healthy: this.healthcheck.checkDiscordWS(),
        status: this.healthcheck.getDiscordWSStatus(),
        uptime_s: this.healthcheck.getDiscordUptime(),
        ready_at: this.healthcheck.getDiscordReadyAt(),
        ping_s: this.healthcheck.getDiscordPing(),
      },
    };

    if (Object.values(tests).some((test) => this.checkTest(test))) {
      throw new InternalServerErrorException(tests);
    } else {
      return tests;
    }
  }

  checkTest(test: unknown): boolean {
    switch (typeof test) {
      case 'object':
        if (test != null) {
          return Object.values(test).some((test) => this.checkTest(test));
        } else {
          return true;
        }
      case 'boolean':
        return !test;
      default:
        return true;
    }
  }
}

export interface UptimeResponse {
  discord: {
    healthy: boolean;
    status: string;
    uptime_s: number | null;
    ready_at: Date | null;
    ping_s: number;
  };
}
