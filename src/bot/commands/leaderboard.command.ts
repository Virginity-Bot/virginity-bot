import { Injectable, Logger } from '@nestjs/common';
import { Command, Handler, InjectDiscordClient } from '@discord-nestjs/core';
import {
  MessagePayload,
  Client,
  CommandInteraction,
  Message,
  PermissionFlagsBits,
} from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { GuildEntity } from 'src/entities/guild/guild.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { DiscordHelperService } from '../discord-helper.service';
import { LeaderboardService } from '../leaderboard.service';
import { boldify } from 'src/utils/logs';

@Command({
  name: 'leaderboard',
  description: 'Replies with the leader board.',
  defaultMemberPermissions: PermissionFlagsBits.SendMessages,
  dmPermission: false,
})
@Injectable()
export class LeaderboardCommand {
  private readonly logger = new Logger(LeaderboardCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vc_events: EntityRepository<VCEventEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly database: DatabaseService,
    private readonly discord_helper: DiscordHelperService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  @Handler()
  @UseRequestContext()
  async handler(
    interaction: CommandInteraction,
  ): Promise<MessagePayload | Message<boolean>> {
    if (interaction.guildId == null || interaction.guild == null) {
      this.logger.error([`interaction.guildId was null somehow`, interaction]);
      throw new Error(`interaction.guildId was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    }

    await interaction.deferReply();

    await this.recalculateScores(interaction.guildId);

    const guild_ent = await this.guilds.findOneOrFail(interaction.guildId);

    const leaderboard = await this.leaderboard.buildLeaderboardEmbed(
      guild_ent,
      interaction.user,
    );

    this.logger.debug(
      boldify`Built leaderboard for guild ${interaction.guild.id}.`,
    );

    await interaction.followUp(
      new MessagePayload(interaction.channel, { embeds: [leaderboard] }),
    );

    this.logger.debug(
      boldify`Sent leaderboard for guild ${interaction.guild.id}.`,
    );
  }

  async recalculateScores(guild_id: string) {
    const timestamp = new Date();
    const users_in_vc = await this.discord_helper.getUsersInVC(guild_id);

    // close all in-progress events
    const events = await Promise.all(
      users_in_vc.map(async (user) => {
        const old_event = await this.database.closeEvent(
          user.guild,
          user,
          timestamp,
        );
        if (old_event != null) {
          return this.database.openEvent(old_event, null, timestamp);
        }
      }),
    );

    // TODO(2): this can throw a `ValidationError: Trying to persist not discovered entity of type undefined.` when someone joins calls leaderboard
    await this.vc_events.persistAndFlush(events);

    // Role Changes when scores are updated.
    this.discord_helper.assignBiggestVirginRoleGuild(guild_id);
  }
}
