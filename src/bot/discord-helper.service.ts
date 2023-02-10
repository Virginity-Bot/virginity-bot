import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Activity,
  ActivityType,
  ChannelType,
  Client,
  DiscordAPIError,
  Events,
  Guild,
  GuildMember,
  GuildPremiumTier,
  PermissionsBitField,
  Role,
  TextChannel,
} from 'discord.js';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { underline } from 'chalk';

import { GuildEntity } from 'src/entities/guild/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { bolder, userLogHeader } from 'src/utils/logs';

@Injectable()
export class DiscordHelperService {
  private readonly logger = new Logger(DiscordHelperService.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
  ) {}

  @On(Events.ClientReady)
  async logInviteURL(client: Client): Promise<void> {
    if (client.application == null) {
      throw new Error(`Discord.JS not yet initialized.`);
    }

    const permissions =
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

    const username =
      this.client.user != null ? bolder`("${this.client.user.tag}") ` : '';
    const link = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&permissions=${permissions}&scope=bot`;

    this.logger.log(
      `Invite the bot ${username}to your server using this link: ${underline(
        link,
      )}`,
    );
  }

  /**
   * Gets all guild members in voice channels at the moment. A guild ID can be
   * specified to just get that guild's members.
   */
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
            c?.type === ChannelType.GuildVoice && c.id !== c.guild.afkChannelId,
        ),
      );

    return voice_channels
      .map((vc) => vc?.members.map((m) => m))
      .flat()
      .filter((m): m is GuildMember => m != null);
  }

  /**
   * Finds or creates the biggest virgin role in a given guild.
   */
  async findOrCreateBiggestVirginRole(guild_ent: GuildEntity): Promise<Role> {
    const guild = this.client.guilds.resolve(guild_ent.id);
    if (guild == null)
      throw new Error(bolder`Could not access guild ${guild_ent.id}`);

    const role =
      guild_ent.biggest_virgin_role_id != null
        ? await guild.roles
            .fetch(guild_ent.biggest_virgin_role_id)
            .then((role) => {
              if (role == null) throw new NotFoundException();
              else return role;
            })
            .then(async (role) => {
              if (role.name !== guild_ent.role.name) {
                await role
                  .setName(guild_ent.role.name)
                  .catch(
                    this.handlePermissionErrors(
                      bolder`Failed to set role name of role ${role.id} in guild ${guild.id}`,
                    ),
                  );
              }

              if (
                role.color.toString(16).toUpperCase() !==
                guild_ent.role.color.slice(1)
              ) {
                await role
                  .setColor(guild_ent.role.color)
                  .catch(
                    this.handlePermissionErrors(
                      bolder`Failed to set role color of role ${role.id} in guild ${guild.id}`,
                    ),
                  );
              }

              const highest_possible_pos = await this.getBotsHighestRole(
                guild,
              ).then((role) => role.position - 1);
              if (role.position < highest_possible_pos) {
                await role
                  .setPosition(highest_possible_pos)
                  .then((role) => {
                    if (role.position !== highest_possible_pos) {
                      throw new Error(
                        bolder`Failed to set role position of ${role.id} in ${guild.id} to ${highest_possible_pos}`,
                      );
                    } else return role;
                  })
                  .catch(
                    this.handlePermissionErrors(
                      bolder`Failed to set role position of ${role.id} in ${guild.id} to ${highest_possible_pos}`,
                    ),
                  );
              }

              if (
                role.unicodeEmoji !== guild_ent.role.emoji &&
                guild.premiumTier > GuildPremiumTier.Tier2
              ) {
                await role
                  .setUnicodeEmoji(guild_ent.role.emoji)
                  .catch((err) => {
                    if (err instanceof DiscordAPIError && err.code === 50101) {
                      this.logger.warn(
                        bolder`Failed to set role emoji for guild ${guild.id}, even though we thought we could`,
                      );
                    } else {
                      return this.handlePermissionErrors(err);
                    }
                  });
              }

              return role;
            })
            .catch((err) => {
              if (err instanceof NotFoundException) {
                return this.createBiggestVirginRole(guild, guild_ent);
              } else throw err;
            })
        : await this.createBiggestVirginRole(guild, guild_ent);

    return role;
  }

  async createBiggestVirginRole(
    guild: Guild,
    guild_ent: GuildEntity,
  ): Promise<Role> {
    const highest_possible_pos = await this.getBotsHighestRole(guild).then(
      (role) => role.position - 1,
    );

    return guild.roles
      .create({
        name: guild_ent.role.name,
        color: guild_ent.role.color,
        unicodeEmoji:
          guild.premiumTier > GuildPremiumTier.Tier2
            ? guild_ent.role.emoji
            : undefined,
        hoist: true,
        mentionable: true,
        position: highest_possible_pos + 1,
      })
      .then<Role>((role) => {
        this.logger.debug(
          bolder`Created virginity-bot text channel in guild "${guild.name}"`,
        );

        guild_ent.biggest_virgin_role_id = role.id;

        return role;
      });
  }

  getBotsHighestRole(guild: Guild): Promise<Role> {
    return guild.members.fetchMe().then((bot) => bot.roles.highest);
  }

  /**
   * Finds or creates the virginity bot text channel in a given guild.
   */
  async findOrCreateVirginityBotChannel(
    guild_ent: GuildEntity,
  ): Promise<TextChannel> {
    const guild = this.client.guilds.resolve(guild_ent.id);
    if (guild == null)
      throw new Error(bolder`Could not access guild ${guild_ent.id}`);

    const channel =
      (guild_ent.bot_channel_id != null
        ? ((await guild.channels.fetch(
            guild_ent.bot_channel_id,
          )) as TextChannel)
        : null) ??
      (await guild.channels
        .fetch()
        .then((channels) =>
          channels.filter(
            (channel): channel is TextChannel =>
              channel?.type === ChannelType.GuildText,
          ),
        )
        .then(
          (channels) =>
            channels.find((channel) => channel.name === 'virginity-bot') ??
            channels.find((channel) => channel.name === 'general') ??
            guild.systemChannel,
        )) ??
      (await guild.channels
        .create<ChannelType.GuildText>({
          type: ChannelType.GuildText,
          name: guild_ent.channel.name,
          topic: guild_ent.channel.description,
        })
        .then<TextChannel>((guild) => {
          this.logger.debug(
            bolder`Created virginity-bot text channel in guild "${guild.name}"`,
          );
          return guild;
        }));

    return channel;
  }

  /**
   * Assigns the biggest virgin role to a specified virgin, while also
   * clearing the role from any pre-existing members.
   */
  async assignBiggestVirginRole(biggest_virgin: VirginEntity) {
    if (biggest_virgin.cached_dur_in_vc === 0) {
      this.logger.debug(`No users have been online. No user crowned.`);
      return;
    }
    const role = await this.findOrCreateBiggestVirginRole(biggest_virgin.guild);

    // const guild = await this.client.guilds.fetch(biggest_virgin.guild.id);
    // const member = await guild.members.fetch(biggest_virgin.id);
    const member = await this.fetchGuildMember(
      biggest_virgin.guild.id,
      biggest_virgin.id,
    );

    // Clear current members of role
    await Promise.all(
      role.members.map((m) =>
        m.roles
          .remove(role.id)
          .catch(
            this.handlePermissionErrors(
              bolder`Failed to remove role from user ${m.id} in guild ${m.guild.id}`,
            ),
          ),
      ),
    );

    if (member != null) {
      await member?.roles
        .add(role.id)
        .then(() =>
          this.logger.debug(bolder`Crowned ${userLogHeader(member)}.`),
        )
        .catch(
          this.handlePermissionErrors(
            bolder`Failed to add role to user ${member.id} in guild ${member.guild.id}`,
          ),
        );
    } else {
      this.logger.warn(`Could not find ${biggest_virgin.id} in Discord API.`);
    }
  }

  async assignBiggestVirginRoleGuild(guild_id: string) {
    const top_virgin = await this.virginsRepo.findOne(
      { guild: guild_id },
      { orderBy: [{ cached_dur_in_vc: -1 }], populate: ['guild'] },
    );
    if (top_virgin == null) return;
    this.assignBiggestVirginRole(top_virgin);
  }

  /**
   * Tests whether an activity counts as a "gaming" activity.
   * Useful as a predicate for `Array::filter`.
   */
  activityGamingTest(a: Activity): boolean {
    // TODO(3): should we allow other activity types?
    return a.type === ActivityType.Playing;
  }

  async fetchGuildMember(
    guild_id: string,
    user_id: string,
  ): Promise<GuildMember | null> {
    return this.client.guilds
      .fetch(guild_id)
      .then((guild) => guild.members.fetch(user_id));
  }

  handlePermissionErrors(message: string): (err: Error) => void {
    return (err: Error) => {
      if (err instanceof DiscordAPIError && err.code === 50013) {
        this.logger.warn(message);
      } else {
        throw err;
      }
    };
  }
}
