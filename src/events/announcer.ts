//This module keeps tabs on the amount of time a user spends on discordand assigns them XP ;)
import { Virgin } from '../entities/virgin-entity';
import { MikroORM, wrap } from '@mikro-orm/core';
import { millisecondsToMinutes } from 'date-fns';
import {
  createAudioResource,
  generateDependencyReport,
  joinVoiceChannel,
  NoSubscriberBehavior,
  createAudioPlayer,
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
} from '@discordjs/voice';
import { channel } from 'diagnostics_channel';

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
      guild: {
        [x: string]: DiscordGatewayAdapterCreator;
        id: any;
      };
      //channel: { guild: { [x: string]: DiscordGatewayAdapterCreator } };
    },
  ) {
    let newUserChannel = newState.channelId;
    let oldUserChannel = oldState.channelId;
    //const orm = await MikroORM.init();
    //const time = Math.round(new Date().getTime() / (1000 * 60)); //returns minutes since 1/1/1970
    //const time = new Date();
    const bot = 943974476469645333n;
    //let guildId = newState.guild.id;
    //let virginity = 0;
    //let username = newState.member.user.username;
    if (
      oldUserChannel == null &&
      newUserChannel != null &&
      newState.member.id != bot
    ) {
      const connection = joinVoiceChannel({
        channelId: newState.channelId,
        guildId: newState.guild.id,
        //adapterCreator: newState.channel.guild.voiceAdapterCreator,
        adapterCreator: newState.guild.voiceAdapterCreator,
      });
      console.log('Bot Entered');
      console.log(connection.state);
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      const resource = createAudioResource('./assets_entrancetheme.mp3');
      connection.subscribe(player);
      player.play(resource);
      //connection.subscribe(player);

      //player.stop();
      player.on(AudioPlayerStatus.Playing, () => {
        console.log('The audio player has started playing!');
      });
      //connection.destroy();
      console.log(connection.listeners);
      console.log(connection.state.status);
      //console.log(generateDependencyReport());
      //await orm.em.flush();
    } else if (
      oldUserChannel !== null &&
      newUserChannel !== null &&
      oldUserChannel != newUserChannel
    ) {
      //c
    } else {
    }
    //cc
  },
};
