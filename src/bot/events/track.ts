import { Injectable } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import { Client, embedLength, time, VoiceState } from 'discord.js';
import { Virgin } from 'src/entities/virgin.entity';

@Injectable()
export class Track {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  @On('voiceStateUpdate')
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

      try {
        const virgin = await orm.findOneOrFail(Virgin, {
          $and: [
            { guild: { $eq: guildId } },
            {
              discordId: {
                $eq: new_state.member.id,
              },
            },
          ],
        });
        const newVirgin = new Virgin(
          new_state.member.id,
          virgin.virginity,
          time,
          guildId,
          username,
        );
        wrap(virgin).assign(newVirgin, { mergeObjects: true });
        await orm.persistAndFlush(virgin);
      } catch (e) {
        //console.error(e); // our custom error
        const newVirgin = new Virgin(
          new_state.member.id,
          virginity,
          time,
          guildId,
          username,
        );
        //console.log('Creating');
        const virgin = orm.create(Virgin, {
          discordId: newVirgin.discordId,
          virginity: newVirgin.virginity,
          blueballs: time,
          guild: guildId,
          username,
        });
        await orm.persistAndFlush(virgin);
      }
    } else if (
      old_state.channelId !== null &&
      new_state.channelId !== null &&
      old_state.channelId != new_state.channelId &&
      eligible == true
    ) {
      // User switches voice channel
    } else if (eligible == true) {
      try {
        const virgin = await orm.findOneOrFail(Virgin, {
          $and: [
            { guild: { $eq: guildId } },
            {
              discordId: {
                $eq: new_state.member.id,
              },
            },
          ],
        });
        //console.log(`exited`);
        const newVirgin = new Virgin(
          new_state.member.id,
          (+millisecondsToMinutes(time.getTime()) -
            +millisecondsToMinutes(virgin.blueballs.getTime())) *
            +streaming +
            +virgin.virginity,
          time,
          guildId,
          username,
        );
        wrap(virgin).assign(newVirgin, { mergeObjects: true });
        await orm.persistAndFlush(virgin);
      } catch (e) {
        //console.error(e); // our custom error
      }
    }
  }
}
function wrap(virgin: any) {
  throw new Error('Function not implemented.');
}

function millisecondsToMinutes(arg0: any) {
  throw new Error('Function not implemented.');
}
