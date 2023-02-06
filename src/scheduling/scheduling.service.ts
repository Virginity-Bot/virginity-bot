import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client } from 'discord.js';
import { CronJob } from 'cron';

import { LeaderboardService } from 'src/bot/leaderboard.service';
import { DiscordHelperService } from 'src/bot/discord-helper.service';
import { GuildEntity } from 'src/entities/guild/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';

@Injectable()
export class TasksService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vc_events: EntityRepository<VCEventEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly leaderboard: LeaderboardService,
    private readonly discord_helper: DiscordHelperService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  @UseRequestContext()
  async onApplicationBootstrap() {
    const guilds = await this.guilds.findAll();
    // TODO(3): do we actually want to batch up our jobs?
    const schedules = guilds
      .filter((guild) => guild.score.reset_enabled)
      .reduce((schedules, guild) => {
        // TODO: get timezone from guild?
        if (
          schedules.get([guild.score.reset_schedule, 'UTC'])?.push(guild.id) ==
          null
        ) {
          schedules.set([guild.score.reset_schedule, 'UTC'], [guild.id]);
        }
        return schedules;
      }, new Map<[string, string], string[]>());

    for (const [schedule, guild_ids] of schedules) {
      const expr = schedule[0];
      const tz = schedule[1];
      try {
        this.scheduler.addCronJob(
          `guild_reset ${schedule}`,
          new CronJob({
            cronTime: expr,
            timeZone: tz,
            onTick: () => this.scoreReset(guild_ids),
            context: this,
            start: true,
          }),
        );
      } catch (err) {
        this.logger.warn(err);
      }
    }
  }

  async scoreReset(guild_ids?: string[]): Promise<void> {
    const [guilds] = await Promise.all([
      guild_ids == null
        ? this.guilds.findAll()
        : this.guilds.find({ id: guild_ids }),
      // preload guilds
      this.client.guilds.fetch(),
    ]);

    await Promise.all(
      guilds
        .filter((guild_ent) => guild_ent.score.reset_enabled)
        .map(async (guild_ent) => {
          // TODO: close all open events and start new ones in-place

          // get the Biggest Virgin for the announcement
          const top_virgin = await this.virgins.findOneOrFail(
            { guild: guild_ent.id },
            { orderBy: [{ cached_dur_in_vc: -1 }] },
          );

          // build leaderboard with reset flavor
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

          // send leaderboard to guild's vbot channel
          await channel.send({
            embeds: [leaderboard],
            content: `Congrats to the week's Chonkiest Virgin: **${
              top_virgin.nickname ?? top_virgin.username
            }**!`,
          });

          // reset scores
          guild_ent.last_reset = new Date();
          await this.virgins.nativeUpdate(
            { guild: guild_ent.id },
            { cached_dur_in_vc: 0 },
          );
        }),
    );

    await this.guilds.flush();

    this.logger.log(
      `Reset scores for ${
        guild_ids != null ? guild_ids.join(', ') : 'all guilds'
      }.`,
    );
  }
}
