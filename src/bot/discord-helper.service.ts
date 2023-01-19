import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Client, GuildMember } from 'discord.js';
import { InjectDiscordClient } from '@discord-nestjs/core';

@Injectable()
export class DiscordHelperService {
  private readonly logger = new Logger(DiscordHelperService.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  async getUsersInVC(): Promise<GuildMember[]> {
    const voice_channels = await this.client.guilds
      .fetch()
      .then((guilds) => Promise.all(guilds.map((guild) => guild.fetch())))
      .then((guilds) =>
        Promise.all(
          guilds.map((guild) =>
            guild.channels
              .fetch()
              .then((channels) => channels.map((channel) => channel)),
          ),
        ),
      )
      .then((channels) => channels.flat())
      .then((channels) =>
        channels.filter(
          (c) =>
            c.type === ChannelType.GuildVoice && c.id !== c.guild.afkChannelId,
        ),
      );

    return voice_channels.map((vc) => vc.members.map((m) => m)).flat();
  }
}
