//This module keeps tabs on the amount of time a user spends on discordand assigns them XP ;)
import { Virgin } from '../entities/virgin-entity';
import { MikroORM, wrap } from '@mikro-orm/core';
import * as dotenv from 'dotenv';
import {
  createAudioResource,
  generateDependencyReport,
  joinVoiceChannel,
  NoSubscriberBehavior,
  createAudioPlayer,
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
} from '@discordjs/voice';

module.exports = {
  //this name MUST be "voiceStateUpdate" its how DiscordJS knows what event its working with
  name: 'voiceStateUpdate',
  once: false,
  //parameters from voiceStateUpdate that you need, if you need more add more
  async execute(
    oldState: { channelId: any },
    newState: {
      channelId: any;
      member: { id: any; user: any };
      guild: {
        [x: string]: DiscordGatewayAdapterCreator;
        id: any;
      };
    },
  ) {
    let newUserChannel = newState.channelId;
    let oldUserChannel = oldState.channelId;
    const orm = (await MikroORM.init()).em.fork();
    dotenv.config();
    const bot = process.env.BOT;
    let guildId = newState.guild.id;
    if (oldUserChannel == null && newUserChannel != null && newState.member.id != bot) {
      try {
        //check if virgin exists in database
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
        try {
          //check if anyone with more virginity exists on server
          const virgin1 = await orm.findOneOrFail(Virgin, {
            $and: [
              { guild: { $eq: guildId } },
              {
                virginity: {
                  $gt: virgin.virginity,
                },
              },
            ],
          });
        } catch (e) {
          const connection = joinVoiceChannel({
            channelId: newState.channelId,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator,
          });
          const player = createAudioPlayer({
            behaviors: {
              noSubscriber: NoSubscriberBehavior.Pause,
            },
          });
          const resource = createAudioResource('assets/assets_entrance_theme.opus', {
            metadata: {
              title: 'The Biggest Virgin!',
            },
          });
          resource.volume?.setVolume(2);
          player.play(resource);
          connection.subscribe(player);
          player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
          });
        }
      } catch (e) {}

      //await orm.em.flush();
    }
    {
    }
  },
};
