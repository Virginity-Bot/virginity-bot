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
}
