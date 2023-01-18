import { Injectable } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import {
  Client,
  embedLength,
  Events,
  InteractionCollector,
  time,
  VoiceState,
} from 'discord.js';
import { Virgin } from 'src/entities/virgin.entity';
import { EntityRepository } from '@mikro-orm/core';
import { VCEvent } from 'src/entities/vc-event.entity';
import millisecondsToMinutes from 'date-fns/millisecondsToMinutes';

@Injectable()
export class Track {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
    private readonly virginsRepo: EntityRepository<Virgin>,
    private readonly vcEventsRepo: EntityRepository<VCEvent>,
  ) {}

  @On(Events.VoiceStateUpdate)
  async voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    console.log('Someone did a thing in VC. Give em Points');
    console.log(arguments);
    let streaming = 1;
    let eligible = false;
    let guildId = new_state.guild.id;
    const bot = process.env.BOT;
    if (old_state.streaming) streaming = 2;
    if (old_state.selfVideo) streaming = 3;
    if (old_state.streaming && old_state.selfVideo) streaming = 4;
    if (!new_state.mute && !new_state.deaf && new_state.member.id != bot)
      eligible = true;

    if (
      old_state.channelId == null &&
      new_state.channelId != null &&
      new_state.member.id != bot &&
      eligible == true
    ) {
      // User Join a voice channel

      const virgin: Virgin = await this.virginsRepo
        .findOneOrFail({
          $and: [
            { guild: { $eq: guildId } },
            {
              snowflake: {
                $eq: new_state.member.id,
              },
            },
          ],
        })
        .catch(() => {
          const newVirgin = this.virginsRepo.create({
            snowflake: new_state.member.id,
            username: new_state.member.user.username,
            discriminator: new_state.member.user.discriminator,
            guild: guildId,
          });

          return newVirgin;
        });
      let vcEvent = this.vcEventsRepo.create({
        guild: new_state.guild,
        virgin: virgin,
        connection_start: new Date(),
        screen: old_state.streaming,
        camera: old_state.selfVideo,
      });
      virgin.vc_events.add(vcEvent);
      await this.virginsRepo.persistAndFlush(virgin);
    } else if (
      old_state.channelId !== null &&
      new_state.channelId !== null &&
      old_state.channelId != new_state.channelId &&
      eligible == true
    ) {
      // User switches voice channel
    } else if (
      old_state.channelId != null &&
      new_state.channelId == null &&
      new_state.member.id != bot &&
      eligible == true
    ) {
      const virgin: Virgin = await this.virginsRepo
        .findOneOrFail({
          $and: [
            { guild: { $eq: guildId } },
            {
              snowflake: {
                $eq: new_state.member.id,
              },
            },
          ],
        })
        .catch(() => {
          const newVirgin = this.virginsRepo.create({
            snowflake: new_state.member.id,
            username: new_state.member.user.username,
            discriminator: new_state.member.user.discriminator,
            guild: guildId,
          });

          return newVirgin;
        });
      let vcEvent = this.vcEventsRepo.create({
        guild: new_state.guild,
        virgin: virgin,
        connection_end: new Date(),
        screen: old_state.streaming,
        camera: old_state.selfVideo,
      });
      const date = new Date();
      const events = await virgin.vc_events.loadItems();
      let streamingBonus = 1;
      if (old_state.streaming) streamingBonus = 2;
      if (old_state.selfVideo) streamingBonus = 3;
      if (old_state.streaming && old_state.selfVideo) streamingBonus = 5;

      virgin.cached_dur_in_vc =
        virgin.cached_dur_in_vc +
        (+millisecondsToMinutes(date.getTime()) -
          +millisecondsToMinutes(events[0].connection_start.getTime())) *
          streamingBonus;
      virgin.vc_events.add(vcEvent);
      await this.virginsRepo.persistAndFlush(virgin);
    } else if (
      old_state.channelId == new_state.channelId &&
      new_state.member.id != bot &&
      eligible == true
    ) {
      //Someone is entering or exiting streaming states
      const virgin: Virgin = await this.virginsRepo
        .findOneOrFail({
          $and: [
            { guild: { $eq: guildId } },
            {
              snowflake: {
                $eq: new_state.member.id,
              },
            },
          ],
        })
        .catch(() => {
          const newVirgin = this.virginsRepo.create({
            snowflake: new_state.member.id,
            username: new_state.member.user.username,
            discriminator: new_state.member.user.discriminator,
            guild: guildId,
          });

          return newVirgin;
        });
      let vcEvent = this.vcEventsRepo.create({
        guild: new_state.guild,
        virgin: virgin,
        connection_start: new Date(),
        screen: old_state.streaming,
        camera: old_state.selfVideo,
      });
      const date = new Date();
      const events = await virgin.vc_events.loadItems();
      let streamingBonus = 1;
      if (old_state.streaming) streamingBonus = 2;
      if (old_state.selfVideo) streamingBonus = 3;
      if (old_state.streaming && old_state.selfVideo) streamingBonus = 5;

      virgin.cached_dur_in_vc =
        virgin.cached_dur_in_vc +
        (+millisecondsToMinutes(date.getTime()) -
          +millisecondsToMinutes(events[0].connection_start.getTime())) *
          streamingBonus;
      virgin.vc_events.add(vcEvent);
      await this.virginsRepo.persistAndFlush(virgin);
    }
  }
}
