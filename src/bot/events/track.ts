import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import {
  Activity,
  ActivityType,
  Client,
  Events,
  Presence,
  PresenceUpdateStatus,
  VoiceState,
} from 'discord.js';
import {
  MikroORM,
  NotFoundError,
  UseRequestContext,
  RequiredEntityData,
} from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { DiscordHelperService } from 'src/bot/discord-helper.service';
import { userLogHeader } from 'src/utils/logs';

@Injectable()
export class Track {
  private readonly logger = new Logger(Track.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vcEventsRepo: EntityRepository<VCEventEntity>,
    private readonly database: DatabaseService,
    private readonly discord_helper: DiscordHelperService,
  ) {}

  @On(Events.VoiceStateUpdate)
  @UseRequestContext()
  async voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    if (new_state.member == null || new_state.member.user.bot) {
      // User is a bot, so we don't need to track them.
      return;
    }

    const timestamp = new Date();
    if (
      // Entering VC
      (old_state.channelId == null &&
        new_state.channelId != null &&
        this.isEligible(new_state)) ||
      // or unmuting / undeafening
      (old_state.channelId != null &&
        !this.isEligible(old_state) &&
        this.isEligible(new_state))
    ) {
      this.logger.debug(
        `${userLogHeader(new_state)} entered VC or unmuted / undeafened.`,
      );
      // create new event
      const event = await this.database.openEvent(new_state, timestamp);
      await this.vcEventsRepo.persistAndFlush(event);
    } else if (
      // Leaving VC
      (old_state.channelId != null && new_state.channelId == null) ||
      // or muting / deafening
      (old_state.channelId != null &&
        this.isEligible(old_state) &&
        !this.isEligible(new_state))
    ) {
      this.logger.debug(
        `${userLogHeader(new_state)} left VC or muted / deafened.`,
      );
      // close old event
      const event = await this.database.closeEvent(
        new_state.guild,
        new_state.member,
        timestamp,
      );
      if (event != null) await this.vcEventsRepo.persistAndFlush(event);
      // TODO(0): calculate new biggest virgin
    } else if (
      // Switching VC
      old_state.channelId != null &&
      new_state.channelId != null
    ) {
      this.logger.debug(`${userLogHeader(new_state)} switched VC channels.`);
      // we can just ignore this
    } else if (
      // Score multiplier change
      old_state.streaming !== new_state.streaming ||
      old_state.selfVideo !== new_state.selfVideo
    ) {
      this.logger.debug(
        `${userLogHeader(new_state)} caused a score multiplier change.`,
      );
      const events = [
        // close old event
        await this.database.closeEvent(
          new_state.guild,
          new_state.member,
          timestamp,
        ),
        // create new event
        await this.database.openEvent(new_state, timestamp),
      ];
      await this.vcEventsRepo.persistAndFlush(events);
    } else {
      this.logger.debug([
        `${userLogHeader(new_state)} made an unrecognized action.`,
        old_state,
        new_state,
      ]);
    }
  }

  @On(Events.PresenceUpdate)
  @UseRequestContext()
  async presenceUpdate(
    old_presence: Presence | null,
    new_presence: Presence,
  ): Promise<void> {
    if (new_presence.guild == null) {
      return;
    }

    const timestamp = new Date();
    // const now_minus_24_hours = sub(timestamp, { days: 1 });

    // TODO: does discord offer a way to tell us if they're in VC?
    // if (new_presence.status === PresenceUpdateStatus.Online)
    const old_vc_event = await this.vcEventsRepo.findOne(
      {
        virgin: [new_presence.userId, new_presence.guild.id],
        // only find recently unclosed transactions
        // connection_start: { $gt: now_minus_24_hours },
        connection_end: null,
      },
      { populate: ['virgin'] },
    );
    if (old_vc_event == null) {
      // user doesn't have open VC Event
      return;
    }

    const old_game_activities =
      old_presence?.activities.filter(this.activityGamingFilter) ?? [];
    const new_game_activities = new_presence.activities.filter(
      this.activityGamingFilter,
    );

    if (
      // Something non-game related changes
      (old_game_activities.length ?? 0) === 0 &&
      new_game_activities.length === 0
    ) {
      // we can just ignore this
    } else if (
      // Starting game
      (old_game_activities.length ?? 0) === 0 &&
      new_game_activities.length > 0
    ) {
      this.logger.debug(
        `${userLogHeader(
          old_vc_event.virgin,
          new_presence.guild,
        )} started playing a game while in VC.`,
      );
      // close old event
      old_vc_event.connection_end = timestamp;
      const events = [
        old_vc_event,
        // create new event
        await this.database.openEvent(old_vc_event, true, timestamp),
      ];
      await this.vcEventsRepo.persistAndFlush(events);
    } else if (
      // Stopping game
      (old_game_activities.length ?? 0) > 0 &&
      new_game_activities.length === 0
    ) {
      this.logger.debug(
        `${userLogHeader(
          old_vc_event.virgin,
          new_presence.guild,
        )} stopped playing a game while in VC.`,
      );
    } else if (
      // Still playing game
      (old_game_activities.length ?? 0) > 0 &&
      new_game_activities.length > 0
    ) {
      // we can just ignore this
    }
  }

  @On(Events.ClientReady)
  @UseRequestContext()
  async ready(client: Client): Promise<void> {
    // const now_minus_24_hours = sub(new Date(), { days: 1 });
    const users_in_vc = await this.discord_helper.getUsersInVC();

    await Promise.all(
      users_in_vc
        .filter((user) => this.isEligible(user.voice))
        .map(async (user) => {
          const user_ent = await this.database.findOrCreateVirgin(
            user.guild,
            user,
          );

          await this.vcEventsRepo
            .findOneOrFail(
              {
                virgin: [user_ent.id, user.guild.id],
                // only find recently unclosed transactions
                // connection_start: { $gt: now_minus_24_hours },
                connection_end: null,
              },
              { orderBy: [{ connection_start: 1 }] },
            )
            .catch((err) => {
              if (err instanceof NotFoundError) {
                this.vcEventsRepo.create({
                  virgin: [user_ent.id, user.guild.id],
                  camera: user.voice?.selfVideo ?? false,
                  screen: user.voice?.streaming ?? false,
                  gaming:
                    (user.presence?.activities.filter(this.activityGamingFilter)
                      .length ?? 0) > 0,
                } as Partial<RequiredEntityData<VCEventEntity>> as VCEventEntity);
              } else {
                throw err;
              }
            });
        }),
    );

    this.virginsRepo.flush();
  }

  /**
   * Evaluates whether or not a given voice state is eligible to earn score.
   */
  isEligible(state: VoiceState): boolean {
    return !state.deaf && !state.mute;
  }

  activityGamingFilter(a: Activity): boolean {
    // TODO(3): should we allow other activity types?
    return a.type === ActivityType.Playing;
  }
}
