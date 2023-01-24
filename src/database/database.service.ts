import { Injectable, Logger } from '@nestjs/common';
import { MikroORM, NotFoundError, RequiredEntityData } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Guild, GuildMember, VoiceState } from 'discord.js';
import { differenceInMinutes } from 'date-fns';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import configuration from 'src/config/configuration';
import { userLogHeader } from 'src/utils/logs';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vcEventsRepo: EntityRepository<VCEventEntity>,
  ) {}

  /**
   * Finds the most recent unclosed event for a given virgin.
   */
  async findEventToClose(virgin: VirginEntity): Promise<VCEventEntity> {
    // TODO(1): limit this to one result?
    const events = await virgin.vc_events.loadItems({
      where: { connection_end: null },
      orderBy: [{ connection_start: -1 }],
    });
    return events[0];
  }

  calculateScoreForEvent(event: VCEventEntity): number {
    if (event.connection_end == null)
      throw new Error(`Event ${event.id} is missing a connection_end`);

    const score_multiplier =
      (event.screen ? configuration.score.multiplier.screen : 1) *
      (event.camera ? configuration.score.multiplier.camera : 1) *
      (event.gaming ? configuration.score.multiplier.gaming : 1);

    return Math.floor(
      Math.abs(
        differenceInMinutes(event.connection_end, event.connection_start),
      ) * score_multiplier,
    );
  }

  /**
   * Finds (or if none found creates) a virgin record.
   */
  findOrCreateVirgin(guild: Guild, member: GuildMember): Promise<VirginEntity> {
    return this.virginsRepo
      .findOneOrFail({
        guild: guild.id,
        id: member.id,
      })
      .catch((err) => {
        if (err instanceof NotFoundError) {
          return this.virginsRepo.create({
            id: member.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            nickname: member.nickname ?? undefined,
            guild: guild.id,
          } as Partial<RequiredEntityData<VirginEntity>> as VirginEntity);
        } else {
          throw err;
        }
      });
  }

  /**
   * Creates a new open vc_event for a user based on the given voice state.
   */
  async openEvent(state: VoiceState, timestamp: Date): Promise<VCEventEntity> {
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
    } as Partial<RequiredEntityData<VCEventEntity>> as VCEventEntity);

    return event;
  }

  /**
   * Finds the latest open event for a given user, closes it, and recalculates
   * the user's score.
   */
  async closeEvent(
    guild: Guild,
    member: GuildMember,
    timestamp: Date,
  ): Promise<VCEventEntity | undefined> {
    // TODO: maybe we don't actually need to talk to the DB right here?
    const virgin = await this.findOrCreateVirgin(guild, member);
    const event = await this.findEventToClose(virgin);

    if (event == null) {
      this.logger.warn(
        `Virgin ${virgin.id} tried to leave VC, but did not have any open vc_events`,
      );
      return;
    }

    event.connection_end = timestamp;
    // TODO: once our scoring lines up 100%, remove this flush
    await this.vcEventsRepo.flush();

    // TODO(1): this should probably just recalculate their whole score
    const additional_score = this.calculateScoreForEvent(event);
    this.logger.debug(
      `Giving ${userLogHeader(virgin, guild)} ${additional_score} points`,
    );

    const additive_score = virgin.cached_dur_in_vc + additional_score;
    const total_score = await this.calculateScore(virgin.id, guild.id);

    if (additive_score !== total_score) {
      this.logger.warn(
        [
          `Score mismatch! User ${userLogHeader(
            virgin,
            guild,
          )}'s score did not match our expected value from calculations!`,
          `Cached: ${additive_score}`,
          `Calculated SQL: ${total_score}`,
        ].join(' '),
      );
    }

    // TODO: remove this once `calculateScore` writes to the DB on its own
    virgin.cached_dur_in_vc = total_score;

    // virgin.cached_dur_in_vc = total_score;

    return event;
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
            * (CASE WHEN vc_event.screen THEN :screen_mult: ELSE 1 END)
            * (CASE WHEN vc_event.camera THEN :camera_mult: ELSE 1 END)
            * (CASE WHEN vc_event.gaming THEN :gaming_mult: ELSE 1 END)
          ))`,
          {
            screen_mult: configuration.score.multiplier.screen,
            camera_mult: configuration.score.multiplier.camera,
            gaming_mult: configuration.score.multiplier.gaming,
          },
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
}
