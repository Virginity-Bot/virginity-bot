import { Injectable, Logger } from '@nestjs/common';
import {
  Command,
  CommandExecutionContext,
  DiscordCommand,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  MessagePayload,
  StringSelectMenuInteraction,
  Client,
} from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { GuildEntity } from 'src/entities/guild.entity';
import configuration from 'src/config/configuration';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { DiscordHelperService } from '../discord-helper.service';
import { LeaderboardService } from '../leaderboard.service';
import { virgin_display_name } from 'src/utils/string-transformers';

@Command({
  name: 'leaderboard',
  description: 'Replies with the leader board.',
})
@Injectable()
export class LeaderboardCommand implements DiscordCommand {
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

  @UseRequestContext()
  async handler(
    interaction: ChatInputCommandInteraction<CacheType>,
    ctx: CommandExecutionContext<
      ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>
    >,
  ): Promise<MessagePayload> {
    if (interaction.guildId == null || interaction.guild == null) {
      this.logger.error([`interaction.guildId was null somehow`, interaction]);
      throw new Error(`interaction.guildId was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    }

    await this.recalculateScores(interaction.guildId);

    const leaderboard = await this.leaderboard.buildLeaderboardEmbed(
      interaction.guild,
      interaction.user,
    );

    return new MessagePayload(interaction.channel, { embeds: [leaderboard] });
  }

  virginToLeaderboardLine(virgin: VirginEntity, pos: number | string): string {
    return `**${pos}.** ${pos === 1 ? '**' : ''}${virgin_display_name(virgin)}${
      pos === 1 ? `** ${configuration.role.emoji}` : ''
    } — ${virgin.cached_dur_in_vc}`;
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
