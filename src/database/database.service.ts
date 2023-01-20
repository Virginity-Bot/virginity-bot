import { Injectable, Logger } from '@nestjs/common';
import { MikroORM, NotFoundError, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { Guild, GuildMember, VoiceState } from 'discord.js';
import configuration from 'src/config/configuration';
import { differenceInMinutes } from 'date-fns';
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
    let score_multiplier = 1;
    if (event.screen) score_multiplier *= configuration.score.multiplier.screen;
    if (event.camera) score_multiplier *= configuration.score.multiplier.camera;

    return (
      Math.abs(
        differenceInMinutes(event.connection_end, event.connection_start),
      ) * score_multiplier
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
            nickname: member.nickname,
            guild: guild.id,
          });
        } else {
          throw err;
        }
      });
  }

  /**
   * Creates a new open vc_event for a user based on the given voice state.
   */
  async openEvent(state: VoiceState, timestamp: Date): Promise<VCEventEntity> {
    // TODO: maybe we don't actually need to talk to the DB right here?
    const virgin = await this.findOrCreateVirgin(state.guild, state.member);

    const event = this.vcEventsRepo.create({
      virgin: [virgin.id, state.guild.id],
      connection_start: timestamp,
      screen: state.streaming,
      camera: state.selfVideo,
    });

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
  ): Promise<VCEventEntity> {
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
    this.logger.log(
      `Giving ${userLogHeader(virgin, guild)} ${additional_score} points`,
    );

    virgin.cached_dur_in_vc += additional_score;

    const total_score = await this.calculateScore(virgin.id, guild.id);

    if (virgin.cached_dur_in_vc != total_score) {
      this.logger.warn(
        [
          `Score mismatch! User ${userLogHeader(
            virgin,
            guild,
          )}'s score did not match our expected value from calculations!`,
          `Cached: ${virgin.cached_dur_in_vc}`,
          `Calculated SQL: ${total_score}`,
        ].join(' '),
      );
    }

    // virgin.cached_dur_in_vc = total_score;

    return event;
  }

  /**
   * Calculates a user's score. Does not update `virgin.cached_dur_in_vc`!
   */
  async calculateScore(virgin_id: string, guild_id: string): Promise<number> {
    // TODO(2): is there a better place to get a query builder from?
    const qb = this.vcEventsRepo.createQueryBuilder();

    const res = await qb
      .getKnex()
      .select([
        'virgin_snowflake',
        'guild_snowflake',
        qb.raw(
          `SUM(FLOOR(
            EXTRACT(EPOCH FROM connection_end - connection_start) / 60
            * (CASE WHEN screen THEN :screen_mult: ELSE 1 END)
            * (CASE WHEN camera THEN :camera_mult: ELSE 1 END)
          ))`,
          {
            screen_mult: configuration.score.multiplier.screen,
            camera_mult: configuration.score.multiplier.camera,
          },
        ),
      ])
      .from('vc_event')
      .where((b) =>
        b
          .where({
            virgin_snowflake: virgin_id,
            guild_snowflake: guild_id,
          })
          .whereNotNull('connection_end'),
      )
      .groupBy(['virgin_snowflake', 'guild_snowflake']);

    return res[0]?.sum ?? 0;
  }
}
