import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client } from 'discord.js';

import configuration from 'src/config/configuration';
import { LeaderboardService } from 'src/bot/leaderboard.service';
import { DiscordHelperService } from 'src/bot/discord-helper.service';
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vcEvents: EntityRepository<VCEventEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly leaderboard: LeaderboardService,
    private readonly discord_helper: DiscordHelperService,
  ) {}

  // TODO: allow configuration of the timezone
  @Cron(configuration.score.reset_schedule, { timeZone: 'America/Los_Angeles' })
  @UseRequestContext()
  async scoreReset(): Promise<void> {
    const [guilds] = await Promise.all([
      this.guilds.findAll(),
      // preload guilds
      this.client.guilds.fetch(),
    ]);

    await Promise.all(
      guilds.map(async (guild_ent) => {
        // TODO: close all open events and start new ones in-place

        // Getting the Biggest Virgin for the announcement
        const top_virgins = await this.virgins.find(
          { guild: guild_ent.id },
          { orderBy: [{ cached_dur_in_vc: -1 }], limit: 10 },
        );
        // send leaderboard to guild's vbot channel
        const [leaderboard, channel] = await Promise.all([
          this.leaderboard.buildLeaderboardEmbed(guild_ent),
          this.discord_helper.findOrCreateVirginityBotChannel(guild_ent),
        ]);
        // TODO(4): "week" here assumes that our `score.reset_schedule` remains weekly
        leaderboard.setTitle(`Last week's biggest virgins:`);
        leaderboard.addFields({
          name: ' ',
          value: 'Scores have now been reset 😇',
        });

        await channel.send({ embeds: [leaderboard] });
        await channel.send(
          "Congrats to this week's Chonkiest Virgin: " +
            top_virgins[0].nickname,
        );

        // reset scores
        guild_ent.last_reset = new Date();
        await this.virgins.nativeUpdate(
          { guild: guild_ent.id },
          { cached_dur_in_vc: 0 },
        );
      }),
    );

    await this.guilds.flush();

    this.logger.log('Reset scores');
  }
}
