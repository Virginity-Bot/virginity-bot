import { InjectDiscordClient } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Client, Status } from 'discord.js';

@Injectable()
export class HealthcheckService {
  private readonly logger = new Logger(HealthcheckService.name);

  constructor(@InjectDiscordClient() private readonly client: Client) {}

  checkDiscordWS(): boolean {
    return this.client.ws.status !== Status.Disconnected;
  }

  getDiscordWSStatus(): string {
    return Status[this.client.ws.status];
  }

  /** Gets the Discord connection uptime in seconds. */
  getDiscordUptime(): number | null {
    return this.client.uptime != null ? this.client.uptime / 1000 : null;
  }

  getDiscordReadyAt(): Date | null {
    return this.client.readyAt;
  }

  /** Gets the ping to Discord in seconds. */
  getDiscordPing(): number {
    return this.client.ws.ping / 1000;
  }
}
