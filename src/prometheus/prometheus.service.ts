import { hostname } from 'node:os';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  Gauge,
  Histogram,
  Counter,
  collectDefaultMetrics,
  exponentialBuckets,
} from 'prom-client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PrometheusService {
  /** Request response times in seconds. */
  response_time_s = new Histogram({
    name: 'vbot_response_time_seconds',
    help: 'Request response times.',
  });

  /** Total count of guilds. */
  guild_count = new Gauge({
    name: 'vbot_guild_count',
    help: 'Total count of guilds.',
    collect: async (): Promise<void> => {
      this.guild_count.set(await this.database.getGuildCount());
    },
  });

  /** Total count of users. */
  user_count = new Gauge({
    name: 'vbot_user_count',
    help: 'Total count of users.',
    collect: async (): Promise<void> => {
      this.user_count.set(await this.database.getUserCount());
    },
  });

  // TODO: Should this be a Counter? Kinda feels like it, but makes the API more awkward
  /** Total count of vc_events. */
  vc_event_count = new Gauge({
    name: 'vbot_vc_event_count',
    help: 'Total count of vc_events.',
    collect: async (): Promise<void> => {
      this.vc_event_count.set(await this.database.getVCEventCount());
    },
  });

  /** Duration of closed VC events in seconds. */
  vc_event_duration_s = new Histogram({
    name: 'vbot_vc_event_duration_seconds',
    help: 'Duration of closed VC events.',
    buckets: exponentialBuckets(1, 4, 10),
  });

  /** Total count of unclosed vc_events. */
  unclosed_vc_event_count = new Gauge({
    name: 'vbot_unclosed_vc_event_count',
    help: 'Total count of unclosed vc_events.',
    collect: async (): Promise<void> => {
      this.unclosed_vc_event_count.set(
        await this.database.getUnclosedVCEventCount(),
      );
    },
  });

  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly database: DatabaseService,
  ) {
    collectDefaultMetrics({ labels: { NODE_APP_INSTANCE: hostname() } });
  }
}
