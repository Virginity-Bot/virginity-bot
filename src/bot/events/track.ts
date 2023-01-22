import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Client, Events, VoiceState } from 'discord.js';
import {
  MikroORM,
  NotFoundError,
  UseRequestContext,
  RequiredEntityData,
} from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { sub, differenceInMinutes } from 'date-fns';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { DiscordHelperService } from '../discord-helper.service';
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
    if (new_state.member?.user.bot) {
      // User is a bot, so we don't need to track them.
      return;
    }

    this.logger.debug(`${userLogHeader(new_state)} caused a VC event.`);

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
      // close old event
      const event = await this.database.closeEvent(
        new_state.guild,
        new_state.member!,
        timestamp,
      );
      if (event != null) await this.vcEventsRepo.persistAndFlush(event);
      // TODO(0): calculate new biggest virgin
    } else if (
      // Switching VC
      old_state.channelId != null &&
      new_state.channelId == null
    ) {
      // we can just ignore this
    } else if (
      // Score multiplier change
      old_state.streaming != new_state.streaming ||
      old_state.selfVideo != new_state.selfVideo
    ) {
      const events = [
        // close old event
        await this.database.closeEvent(
          new_state.guild,
          new_state.member!,
          timestamp,
        ),
        // create new event
        await this.database.openEvent(new_state, timestamp),
      ];
      await this.vcEventsRepo.persistAndFlush(events);
    }
  }

  @On(Events.ClientReady)
  @UseRequestContext()
  async ready(client: Client): Promise<void> {
    const now_minus_24_hours = sub(new Date(), { days: 1 });
    const users_in_vc = await this.discord_helper.getUsersInVC();

    await Promise.all(
      users_in_vc
        .filter((user) => this.isEligible(user.voice))
        .map(async (user) => {
          const user_ent = await this.database.findOrCreateVirgin(
            user.guild,
            user,
          );

          const res = await this.vcEventsRepo
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
                } as Partial<RequiredEntityData<VCEventEntity>> as any);
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
}
