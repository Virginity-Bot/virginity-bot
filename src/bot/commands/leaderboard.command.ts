import {
  Injectable,
  Logger,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
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
import { boldify } from 'src/utils/logs';
import { DiscordHelperService } from '../discord-helper.service';
import { LeaderboardService } from '../leaderboard.service';
import { TimingLogInterceptor } from '../interceptors/logging.interceptor';
import { CatchallErrorFilter } from '../filters/catchall-error.filter';

@Command({
  name: 'leaderboard',
  description: 'Replies with the leader board.',
  defaultMemberPermissions: PermissionFlagsBits.SendMessages,
  dmPermission: false,
})
@Injectable()
@UseInterceptors(TimingLogInterceptor)
@UseFilters(CatchallErrorFilter)
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
    this.logger.debug(
      boldify`[${interaction.id}] ${'/leaderboard'} called from guild ${
        interaction.guildId
      }.`,
    );

    if (interaction.guildId == null || interaction.guild == null) {
      this.logger.error([`interaction.guildId was null somehow`, interaction]);
      throw new Error(`interaction.guildId was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    }

    await interaction.deferReply();
    this.logger.debug(
      boldify`[${interaction.id}] Deferred reply ${interaction.id}.`,
    );

    await this.recalculateScores(interaction.guildId);

    this.logger.debug(
      boldify`[${interaction.id}] Recalculated scores for ${interaction.guild.id}.`,
    );

    const guild_ent = await this.guilds.findOneOrFail(interaction.guildId);

    this.logger.debug(
      boldify`[${interaction.id}] Found guild ${interaction.guild.id}.`,
    );

    const leaderboard = await this.leaderboard.buildLeaderboardEmbed(
      guild_ent,
      interaction.user,
    );

    this.logger.debug(
      boldify`[${interaction.id}] Built leaderboard for guild ${interaction.guild.id}.`,
    );

    return interaction
      .followUp(
        new MessagePayload(interaction.channel, { embeds: [leaderboard] }),
      )
      .then((message) => {
        this.logger.debug(
          boldify`[${interaction.id}] Sent leaderboard to guild ${interaction.guildId}.`,
        );
        return message;
      });
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
    ).then((events) =>
      events.filter((event): event is VCEventEntity => event != null),
    );

    await this.vc_events.persistAndFlush(events);

    // Role Changes when scores are updated.
    this.discord_helper.assignBiggestVirginRoleGuild(guild_id);
  }
}
