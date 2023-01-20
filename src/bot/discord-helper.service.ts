import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelType,
  Client,
  Collection,
  Events,
  Guild,
  GuildMember,
  OAuth2Guild,
  PermissionsBitField,
  Role,
} from 'discord.js';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import configuration from 'src/config/configuration';
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { userLogHeader } from 'src/utils/logs';

@Injectable()
export class DiscordHelperService {
  private readonly logger = new Logger(DiscordHelperService.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @On(Events.ClientReady)
  async logInviteURL(client: Client): Promise<void> {
    let permissions =
      PermissionsBitField.Flags.ManageRoles +
      PermissionsBitField.Flags.ManageChannels +
      // TODO: do we need this to get slash commands?
      PermissionsBitField.Flags.ReadMessageHistory +
      PermissionsBitField.Flags.SendMessages +
      PermissionsBitField.Flags.MentionEveryone +
      PermissionsBitField.Flags.UseApplicationCommands +
      PermissionsBitField.Flags.Connect +
      PermissionsBitField.Flags.Speak +
      PermissionsBitField.Flags.UseVAD;

    const client_id = client.application.id;

    const link = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&permissions=${permissions}&scope=bot`;

    this.logger.log(`Invite the bot to your server using this link: ${link}`);
  }

  async getUsersInVC(guild_id?: string): Promise<GuildMember[]> {
    const voice_channels = await (guild_id != null
      ? this.client.guilds.fetch(guild_id).then((guild) => [guild])
      : this.client.guilds
          .fetch()
          .then((guilds) => Promise.all(guilds.map((guild) => guild.fetch())))
    )
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
      (await guild.roles
        .create({
          name: configuration.role.name,
          color: configuration.role.color,
          unicodeEmoji: configuration.role.emoji,
          hoist: true,
          mentionable: true,
        })
        .then(async (role) => {
          // TODO(2): does this actually work?
          // await role.setPosition(0);
          return role;
        }));

    if (role.name !== configuration.role.name) {
      await role.setName(configuration.role.name);
    }
    if (role.color !== configuration.role.color) {
      await role.setColor(configuration.role.color);
    }
    // TODO(3): check if the guild is boosted enough to set role emojis
    // if (role.unicodeEmoji !== configuration.role.emoji) {
    //   await role.setUnicodeEmoji(configuration.role.emoji);
    // }

    guild_ent.biggest_virgin_role_id = role.id;

    return role;
  }

  async assignBiggestVirginRole(biggest_virgin: VirginEntity) {
    const role = await this.findOrCreateBiggestVirginRole(biggest_virgin.guild);

    const guild = await this.client.guilds.fetch(biggest_virgin.guild.id);
    const member = await guild.members.fetch(biggest_virgin.id);

    await Promise.all(role.members.map((m) => m.roles.remove(role.id)));

    await member.roles.add(role.id);

    this.logger.debug(`Crowning ${userLogHeader(member)}.`);
  }
}
