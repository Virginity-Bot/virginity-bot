import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Client, GuildMember, Role } from 'discord.js';
import { InjectDiscordClient } from '@discord-nestjs/core';
import configuration from 'src/config/configuration';
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';

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

  async findOrCreateBiggestVirginRole(guild_ent: GuildEntity): Promise<Role> {
    const guild = this.client.guilds.resolve(guild_ent.id);
    const role =
      (await guild.roles.fetch()).find(
        (role) => role.name === configuration.role.name,
      ) ??
      (await guild.roles.create({
        name: configuration.role.name,
        color: configuration.role.color,
        unicodeEmoji: configuration.role.emoji,
        hoist: true,
        mentionable: true,
      }));

    guild_ent.biggest_virgin_role_id = role.id;

    return role;
  }

  async assignBiggestVirginRole(biggest_virgin: VirginEntity) {
    const role = await this.findOrCreateBiggestVirginRole(biggest_virgin.guild);

    // TODO(1): does this work if we miss the cache?
    const guild = this.client.guilds.resolve(biggest_virgin.guild.id);
    const member = guild.members.resolve(biggest_virgin.id);

    await Promise.all(role.members.map((m) => m.roles.remove(role.id)));

    await member.roles.add(role.id);
  }
}
