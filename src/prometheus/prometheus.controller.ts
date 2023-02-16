import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';

import { PrometheusService } from './prometheus.service';

@Controller('/metrics')
export class PrometheusController {
  constructor(private readonly prom_service: PrometheusService) {}

  @Get()
  @Header('Content-Type', register.contentType)
  metrics(): Promise<string> {
    return register.metrics();
  }
}
