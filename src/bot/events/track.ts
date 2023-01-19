import { Injectable, Logger } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import {
  ChannelType,
  Client,
  embedLength,
  Events,
  Guild,
  GuildMember,
  InteractionCollector,
  time,
  VoiceState,
} from 'discord.js';
import { MikroORM, NotFoundError, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  sub,
  millisecondsToMinutes,
  differenceInMinutes,
  differenceInSeconds,
} from 'date-fns';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import configuration from 'src/config/configuration';

@Injectable()
export class Track {
  private readonly logger = new Logger(Track.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vcEventsRepo: EntityRepository<VCEventEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @On(Events.VoiceStateUpdate)
  @UseRequestContext()
  async voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    const timestamp = new Date();

    if (
      // Entering VC
      (old_state.channelId == null &&
        new_state.channelId != null &&
        this.isEligable(new_state)) ||
      // or unmuting / undeafening
      (old_state.channelId != null &&
        !this.isEligable(old_state) &&
        this.isEligable(new_state))
    ) {
      // create new event
      const event = await this.openEvent(new_state, timestamp);
      await this.vcEventsRepo.persistAndFlush(event);
    } else if (
      // Leaving VC
      (old_state.channelId != null && new_state.channelId == null) ||
      // or muting / deafening
      (old_state.channelId != null &&
        this.isEligable(old_state) &&
        !this.isEligable(new_state))
    ) {
      // close old event
      const event = await this.closeEvent(
        new_state.guild,
        new_state.member,
        timestamp,
      );
      await this.vcEventsRepo.persistAndFlush(event);
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
        await this.closeEvent(new_state.guild, new_state.member, timestamp),
        // create new event
        await this.openEvent(new_state, timestamp),
      ];

      await this.vcEventsRepo.persistAndFlush(events);
    }
  }

  @On(Events.ClientReady)
  @UseRequestContext()
  async ready(client: Client): Promise<void> {
    const voice_channels = await client.guilds
      .fetch()
      .then((guilds) => Promise.all(guilds.map((guild) => guild.fetch())))
      .then((guilds) =>
        Promise.all(
          guilds.map((guild) =>
            guild.channels
              .fetch()
              .then((channels) => channels.map((channel) => channel)),
          ),
        ),
      )
      .then((channels) => channels.flat())
      .then((channels) =>
        channels.filter(
          (c) =>
            c.type === ChannelType.GuildVoice && c.id !== c.guild.afkChannelId,
        ),
      );

    const now_minus_24_hours = sub(new Date(), { days: 1 });
    const users = voice_channels.map((vc) => vc.members.map((m) => m)).flat();
    await Promise.all(
      users.map(async (user) => {
        const user_ent = await this.virginsRepo
          .findOneOrFail({ id: user.id })
          .catch((err) => {
            if (err instanceof NotFoundError) {
              return this.virginsRepo.create({
                id: user.id,
                username: user.user.username,
                discriminator: user.user.discriminator,
                guild: { id: user.guild.id, name: user.guild.name },
              });
            } else {
              throw err;
            }
          });

        const res = await this.vcEventsRepo
          .findOneOrFail(
            {
              virgin: user_ent.id,
              guild: user.guild.id,
              // only find recently unclosed transactions
              // connection_start: { $gt: now_minus_24_hours },
              connection_end: null,
            },
            { orderBy: [{ connection_start: 1 }] },
          )
          .catch((err) => {
            if (err instanceof NotFoundError) {
              this.vcEventsRepo.create({
                virgin: user_ent.id,
                guild: user.guild.id,
                // TODO(1): how do we get the user's state?
                // camera: user,
                // screen: ,
              });
            }
          });
      }),
    );

    this.virginsRepo.flush();
  }

  isEligable(state: VoiceState): boolean {
    return !state.deaf && !state.mute;
  }

  async findEventToClose(virgin: VirginEntity): Promise<VCEventEntity> {
    // TODO: limit this to one result?
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
            guild: { id: guild.id, name: guild.name },
          });
        } else {
          throw err;
        }
      });
  }

  async openEvent(state: VoiceState, timestamp: Date): Promise<VCEventEntity> {
    // TODO: maybe we don't actually need to talk to the DB right here?
    const virgin = await this.findOrCreateVirgin(state.guild, state.member);

    const event = this.vcEventsRepo.create({
      virgin: virgin.id,
      guild: state.guild.id,
      connection_start: timestamp,
      screen: state.streaming,
      camera: state.selfVideo,
    });

    return event;
  }

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

    const score = this.calculateScoreForEvent(event);
    this.logger.log(
      `Giving ${virgin.username}#${virgin.discriminator} of ${guild.name} ${score} points`,
    );

    virgin.cached_dur_in_vc += score;

    return event;
  }
}
