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
    oldState: { channelId: any; selfVideo: boolean; streaming: boolean },
    newState: {
      channelId: any;
      member: { id: any; user: any };
      guild: { id: any };
      streaming: boolean;
      mute: boolean;
      deaf: boolean;
      selfVideo: boolean;
    },
  ) {
    //console.log(`Voice.`);
    let newUserChannel = newState.channelId;
    let oldUserChannel = oldState.channelId;
    let streaming = 1;
    let eligible = true;
    const orm = (await MikroORM.init()).em.fork();
    dotenv.config();
    const time = new Date();
    //This is needed to check if user is BOT and if so it wont be tracked
    const bot = process.env.BOT;
    let guildId = newState.guild.id;
    let virginity = 0;
    let username = newState.member.user.username.toLowerCase();
    //Checks if streaming and adds multiplier if so
    if (oldState.streaming) streaming = 2;
    if (oldState.selfVideo) streaming = 2.5;
    if (oldState.streaming && oldState.selfVideo) streaming = 3;
    if (
      !newState.mute &&
      !newState.deaf &&
      newState.member.id != bot &&
      oldUserChannel != null &&
      newUserChannel == null
    )
      //check if user "should" receive points. If user is mute, deaf, or hasn't spoken in a long time.
      //Anti gaming
      eligible = true;
    //Listens for every update on a users channel state.
    //Check if eligible for points/update if so it will apply points accordingly
    //if user isn't in DB an entry will be created for them
    if (oldUserChannel == null && newUserChannel != null && newState.member.id != bot) {
      // User Join a voice channel

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
        const virgin1 = new Virgin(newState.member.id, virgin.virginity, time, guildId, username);
        wrap(virgin).assign(virgin1, { mergeObjects: true });
        await orm.persistAndFlush(virgin);
      } catch (e) {
        //console.error(e); // our custom error
        const virgin1 = new Virgin(newState.member.id, virginity, time, guildId, username);
        //console.log('Creating');
        const virgin = orm.create(Virgin, {
          discordId: virgin1.discordId,
          virginity: virgin1.virginity,
          blueballs: time,
          guild: guildId,
          username,
        });
        await orm.persistAndFlush(virgin);
      }
    } else if (oldUserChannel !== null && newUserChannel !== null && oldUserChannel != newUserChannel) {
      // User switches voice channel
    } else {
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
        const vp = millisecondsToMinutes(time.getTime()) - millisecondsToMinutes(virgin.blueballs.getTime());
        const virgin1 = new Virgin(newState.member.id, vp + virgin.virginity, time, guildId, username);
        console.log('To Add: ' + vp);
        console.log('Old points: ' + virgin.virginity);
        wrap(virgin).assign(virgin1, { mergeObjects: true });
        await orm.persistAndFlush(virgin);
      } catch (e) {
        //console.error(e); // our custom error
      }
    }
  },
};
