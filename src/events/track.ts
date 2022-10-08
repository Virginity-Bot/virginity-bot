//This module keeps tabs on the amount of time a user spends on discordand assigns them XP ;)
import { Virgin } from '../entities/virgin-entity';
import { MikroORM, wrap } from '@mikro-orm/core';
import { millisecondsToMinutes } from 'date-fns';
import * as dotenv from 'dotenv';

module.exports = {
  //this name MUST be "voiceStateUpdate" its how discordjs knows what event its working with
  name: 'voiceStateUpdate',
  once: false,
  //paramaters from voiceStateUpdate that you need, if you need more add more
  async execute(
    oldState: { channelId: any },
    newState: {
      channelId: any;
      member: { id: any; user: any };
      guild: { id: any };
    },
  ) {
    //console.log(`Voice.`);
    let newUserChannel = newState.channelId;
    let oldUserChannel = oldState.channelId;
    let multi = 1;
    const orm = (await MikroORM.init()).em.fork();
    dotenv.config();
    const time = new Date();
    const bot = process.env.BOT;
    let guildId = newState.guild.id;
    let virginity = 0;
    let username = newState.member.user.username.toLowerCase();
    const testvirgin = new Virgin(
      newState.member.id,
      virginity,
      time,
      guildId,
      username,
    );
    //This set of If statements checks if a user is joining, moving (between channels), or leaving a discord.
    //Listens for every update on a users channel state.
    if (newState.member)
      if (
        oldUserChannel == null &&
        newUserChannel != null &&
        newState.member.id != bot
      ) {
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
          //console.error(e); // our custom error
          const virgin1 = new Virgin(
            newState.member.id,
            virginity,
            time,
            guildId,
            username,
          );
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
      } else if (
        oldUserChannel !== null &&
        newUserChannel !== null &&
        oldUserChannel != newUserChannel
      ) {
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
          const virgin1 = new Virgin(
            newState.member.id,
            millisecondsToMinutes(time.getTime()) -
              millisecondsToMinutes(virgin.blueballs.getTime()),
            time,
            guildId,
            username,
          );
          wrap(virgin).assign(virgin1, { mergeObjects: true });
          await orm.persistAndFlush(virgin);
        } catch (e) {
          //console.error(e); // our custom error
        }
      }
  },
};

//const update = async () => {};
