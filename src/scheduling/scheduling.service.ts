import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import {
  ChannelType,
  Client,
  Collection,
  Guild,
  GuildChannel,
  GuildMember,
  NonThreadGuildBasedChannel,
  TextChannel,
  VoiceState,
} from 'discord.js';
import configuration from 'src/config/configuration';
import { userLogHeader } from 'src/utils/logs';
import { GuildEntity } from 'src/entities/guild.entity';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { LeaderboardService } from 'src/bot/leaderboard.service';

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
      guilds.map(async (guild) => {
        // TODO: close all open events and start new ones in-place

        // send leaderboard to guild's vbot channel
        const [leaderboard, channel] = await Promise.all([
          this.leaderboard.buildLeaderboardEmbed(guild),
          // TODO(2): How should we be identifying a channel to message?
          this.client.guilds
            .fetch(guild.id)
            .then<[Guild, Collection<string, TextChannel>]>(async (guild) => [
              guild,
              await guild.channels
                .fetch()
                .then((channels) =>
                  channels.filter(
                    (channel): channel is TextChannel =>
                      channel?.type === ChannelType.GuildText,
                  ),
                ),
            ])
            .then(
              ([guild, channels]) =>
                channels.find((channel) => channel.name === 'virginity-bot') ??
                channels.find((channel) => channel.name === 'general') ??
                guild.systemChannel,
            ),
        ]);

        // TODO(1): add some text to explain why this message was sent
        await channel?.send({ embeds: [leaderboard] });

        // reset scores
        guild.last_reset = new Date();
        await this.virgins.nativeUpdate(
          { guild: guild.id },
          { cached_dur_in_vc: 0 },
        );
      }),
    );

    await this.guilds.flush();

    this.logger.log('Reset scores');
  }
}
