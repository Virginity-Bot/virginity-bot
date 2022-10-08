//This module keeps tabs on the amount of time a user spends on discord and assigns them XP ;)
//Streaming applies an x2 multiplier as of now
import { Virgin } from '../entities/virgin-entity';
import { MikroORM, wrap } from '@mikro-orm/core';
import { millisecondsToMinutes } from 'date-fns';
import * as dotenv from 'dotenv';

module.exports = {
  //In this case the name MUST be "voiceStateUpdate" its how DiscordJS knows what event its working with
  name: 'voiceStateUpdate',
  once: false,
  //parameters from voiceStateUpdate that you need, if you need more add more
  async execute(
    oldState: { channelId: any },
    newState: {
      channelId: any;
      member: { id: any; user: any };
      guild: { id: any };
      streaming: boolean;
      mute: boolean;
      deaf: boolean;
      requestToSpeakTimestamp: number;
    },
  ) {
    //console.log(`Voice.`);
    let newUserChannel = newState.channelId;
    let oldUserChannel = oldState.channelId;
    let streaming = 1;
    let eligibility = true;
    const orm = (await MikroORM.init()).em.fork();
    dotenv.config();
    const time = new Date();
    const bot = process.env.BOT;
    let guildId = newState.guild.id;
    let virginity = 0;
    let username = newState.member.user.username.toLowerCase();
    //Checks if streaming and adds multiplier if so
    if (newState.streaming) streaming = 2;
    //check if user "should" receive points. If user is mute, deaf, or hasn't spoken in a long time.
    //Anti gaming
    if (newState.mute || newState.deaf || newState.requestToSpeakTimestamp > 60)
      eligibility = false;
    //This set of If statements checks if a user is joining, moving (between channels), or leaving a discord.
    //Listens for every update on a users channel state.
    if (
      oldUserChannel == null &&
      newUserChannel != null &&
      newState.member.id != bot &&
      eligibility != false
    ) {
      // User Join a voice channel
      //No points assigned time stamp updated
      try {
        const virgin = await orm.findOneOrFail(Virgin, {
          $and: [
            { guild: { $eq: guildId } },
            {
              discordId: {
                $eq: newState.member.id,
              },
            },
          ],
        });
        const virgin1 = new Virgin(
          newState.member.id,
          virgin.virginity,
          time,
          guildId,
          username,
        );
        wrap(virgin).assign(virgin1, { mergeObjects: true });
        await orm.persistAndFlush(virgin);
      } catch (e) {
        //Catch is if user is new
        const virgin1 = new Virgin(
          newState.member.id,
          virginity,
          time,
          guildId,
          username,
        );
        const virgin = orm.create(Virgin, {
          discordId: virgin1.discordId,
          virginity: virgin1.virginity,
          blueballs: time,
          guild: guildId,
          username,
        });
        await orm.persistAndFlush(virgin);
      }
      //Switched nothing done but we could do something
    } else if (
      oldUserChannel !== null &&
      newUserChannel !== null &&
      oldUserChannel != newUserChannel
    ) {
      // User switches voice channel
    } else if (eligibility != false) {
      //User exited, here we calculate points and update the DB
      try {
        const virgin = await orm.findOneOrFail(Virgin, {
          $and: [
            { guild: { $eq: guildId } },
            {
              discordId: {
                $eq: newState.member.id,
              },
            },
          ],
        });
        //console.log(`exited`);
        const virgin1 = new Virgin(
          newState.member.id,
          millisecondsToMinutes(time.getTime()) * streaming -
            millisecondsToMinutes(virgin.blueballs.getTime()),
          time,
          guildId,
          username,
        );
        wrap(virgin).assign(virgin1, { mergeObjects: true });
        await orm.persistAndFlush(virgin);
      } catch (e) {
        //User left channel without entering scenario (Bot was just added)
      }
    }
  },
};
