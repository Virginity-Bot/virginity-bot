import { Injectable, Logger } from '@nestjs/common';
import { MikroORM, NotFoundError, RequiredEntityData } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  APIInteractionGuildMember,
  Client,
  Guild,
  GuildMember,
  VoiceState,
} from 'discord.js';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { boldify, userLogHeader } from 'src/utils/logs';
import { DiscordHelperService } from 'src/bot/discord-helper.service';
import { GuildEntity } from 'src/entities/guild';
import { PrometheusService } from 'src/prometheus/prometheus.service';
import { IntroSongEntity } from 'src/entities/intro-song.entity';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vcEventsRepo: EntityRepository<VCEventEntity>,
    @InjectRepository(IntroSongEntity)
    private readonly intro_songs: EntityRepository<IntroSongEntity>,
    private readonly prometheus: PrometheusService,
    private readonly discord_helper: DiscordHelperService,
    @InjectDiscordClient()
    private readonly discord_client: Client,
  ) {}

  /**
   * Finds the most recent unclosed event for a given virgin.
   */
  async findEventToClose(virgin: VirginEntity): Promise<VCEventEntity | null> {
    return this.vcEventsRepo.findOne(
      {
        virgin,
        connection_end: null,
      },
      {
        orderBy: [{ connection_start: -1 }],
        populate: ['guild'],
      },
    );
  }

  calculateScoreForEvent(event: VCEventEntity): number {
    if (event.connection_end == null)
      throw new Error(`Event ${event.id} is missing a connection_end`);

    const score_multiplier =
      (event.screen ? event.guild.score.multiplier.screen : 1) *
      (event.camera ? event.guild.score.multiplier.camera : 1) *
      (event.gaming ? event.guild.score.multiplier.gaming : 1);

    return Math.floor(
      Math.abs(
        differenceInMinutes(event.connection_end, event.connection_start),
      ) * score_multiplier,
    );
  }

  /**
   * Finds (or if none found creates) a virgin record.
   */
  findOrCreateVirgin(
    guild: Guild,
    member: GuildMember | APIInteractionGuildMember,
  ): Promise<VirginEntity> {
    return this.virginsRepo
      .findOneOrFail({
        guild: guild.id,
        id: member.user.id,
      })
      .catch(async (err) => {
        if (err instanceof NotFoundError) {
          let nickname;
          if ('nickname' in (member as GuildMember)) {
            nickname = (member as GuildMember).nickname;
          } else {
            nickname =
              (
                await (
                  await this.discord_client.guilds.fetch(guild.id)
                ).members.fetch(member.user.id)
              ).nickname ?? undefined;
          }

          return this.virginsRepo.create({
            id: member.user.id,
            guild: guild.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            nickname,
          } as Partial<RequiredEntityData<VirginEntity>> as VirginEntity);
        } else {
          throw err;
        }
      });
  }

  /**
   * Creates a new open vc_event for a user based on the given voice state.
   */
  async openEvent(state: VoiceState, timestamp: Date): Promise<VCEventEntity>;
  async openEvent(
    old_vc_event: VCEventEntity,
    states: Partial<Pick<VCEventEntity, 'camera' | 'gaming' | 'screen'>> | null,
    timestamp: Date,
  ): Promise<VCEventEntity>;
  async openEvent(...args: unknown[]): Promise<VCEventEntity> {
    switch (args.length) {
      case 2: {
        const state = args[0] as VoiceState;
        const timestamp = args[1] as Date;

        if (state.member == null) {
          this.logger.error([`State.member was null somehow`, state]);
          throw new Error(`State.member was null somehow`);
        }
        // TODO: maybe we don't actually need to talk to the DB right here?
        const virgin = await this.findOrCreateVirgin(state.guild, state.member);

        const event = this.vcEventsRepo.create({
          virgin: [virgin.id, state.guild.id],
          connection_start: timestamp,
          screen: state.streaming ?? false,
          camera: state.selfVideo ?? false,
          gaming:
            (state.member.presence?.activities.filter(
              this.discord_helper.activityGamingTest,
            ).length ?? 0) > 0,
        } as Partial<RequiredEntityData<VCEventEntity>> as VCEventEntity);

        return event;
      }
      case 3: {
        const old_vc_event = args[0] as VCEventEntity;
        const states = args[1] as Partial<
          Pick<VCEventEntity, 'camera' | 'gaming' | 'screen'>
        > | null;
        const timestamp = args[2] as Date;

        const event = this.vcEventsRepo.create({
          virgin: old_vc_event.virgin,
          connection_start: timestamp,
          screen: states?.screen ?? old_vc_event.screen ?? false,
          camera: states?.camera ?? old_vc_event.camera ?? false,
          gaming: states?.gaming ?? old_vc_event.gaming ?? false,
        } as Partial<RequiredEntityData<VCEventEntity>> as VCEventEntity);

        return event;
      }
      default:
        throw new TypeError(`Expected 2 or 3 parameters.`);
    }
  }

  /**
   * Finds the latest open event for a given user, closes it, and recalculates
   * the user's score.
   */
  async closeEvent(
    guild: Guild,
    member: GuildMember | APIInteractionGuildMember,
    timestamp: Date,
  ): Promise<VCEventEntity | undefined> {
    // TODO: maybe we don't actually need to talk to the DB right here?
    const virgin_ent = await this.findOrCreateVirgin(guild, member);
    const event_ent = await this.findEventToClose(virgin_ent);

    if (event_ent == null) {
      this.logger.warn(
        boldify`Virgin ${virgin_ent.id} tried to leave VC, but did not have any open vc_events`,
      );
      return;
    }

    if (event_ent.guild == null)
      event_ent.guild = await this.guilds.findOneOrFail(guild.id);

    event_ent.connection_end = timestamp;
    // TODO: once our scoring lines up 100%, remove this flush
    await this.vcEventsRepo.flush();

    this.prometheus.vc_event_duration_s.observe(
      Math.abs(
        differenceInSeconds(
          event_ent.connection_end,
          event_ent.connection_start,
        ),
      ),
    );

    // TODO(1): this should probably just recalculate their whole score
    const additional_score = this.calculateScoreForEvent(event_ent);
    this.logger.debug(
      boldify`Giving ${userLogHeader(
        virgin_ent,
        guild,
      )} ${additional_score} points`,
    );

    const additive_score = virgin_ent.cached_dur_in_vc + additional_score;
    const total_score = await this.calculateScore(virgin_ent.id, guild.id);

    if (additive_score !== total_score) {
      this.logger.warn(
        [
          boldify`Score mismatch! User ${userLogHeader(
            virgin_ent,
            guild,
          )}'s score did not match our expected value from calculations!`,
          boldify`Cached: ${additive_score}`,
          boldify`Calculated SQL: ${total_score}`,
        ].join(' '),
      );
    }

    // TODO: remove this once `calculateScore` writes to the DB on its own
    virgin_ent.cached_dur_in_vc = total_score;

    return event_ent;
  }

  /**
   * Calculates a user's score. Does not update `virgin.cached_dur_in_vc`!
   */
  async calculateScore(virgin_id: string, guild_id: string): Promise<number> {
    // TODO(2): is there a better place to get a query builder from?
    const qb = this.vcEventsRepo.createQueryBuilder();

    // TODO: write result to DB
    const res = await qb
      .getKnex()
      .select([
        'virgin_snowflake',
        'guild_snowflake',
        qb.raw(
          `SUM(FLOOR(
            EXTRACT(EPOCH FROM vc_event.connection_end - vc_event.connection_start) / 60
            * (CASE WHEN vc_event.screen THEN guild.score_multiplier_screen ELSE 1 END)
            * (CASE WHEN vc_event.camera THEN guild.score_multiplier_camera ELSE 1 END)
            * (CASE WHEN vc_event.gaming THEN guild.score_multiplier_gaming ELSE 1 END)
          ))`,
        ),
      ])
      .from('vc_event')
      .join('guild', 'guild.id', 'vc_event.guild_snowflake')
      .where((b) =>
        b
          .where({
            virgin_snowflake: virgin_id,
            guild_snowflake: guild_id,
          })
          .whereRaw('vc_event.connection_start >= guild.last_reset')
          .whereNotNull('vc_event.connection_end'),
      )
      .groupBy(['vc_event.virgin_snowflake', 'vc_event.guild_snowflake']);

    return parseInt(res[0]?.sum ?? '0');
  }

  getGuildCount(): Promise<number> {
    return this.guilds.count();
  }

  getUserCount(): Promise<number> {
    return this.virginsRepo.count();
  }

  getVCEventCount(): Promise<number> {
    return this.vcEventsRepo.count();
  }

  getUnclosedVCEventCount({
    start = new Date(0),
    end = new Date(),
  } = {}): Promise<number> {
    return this.vcEventsRepo.count({
      connection_start: { $gte: start, $lte: end },
      connection_end: null,
    });
  }

  getIntroSongCount(): Promise<number> {
    return this.intro_songs.count();
  }
}
