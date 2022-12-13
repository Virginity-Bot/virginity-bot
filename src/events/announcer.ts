//This module keeps tabs on the amount of time a user spends on discordand assigns them XP ;)
import * as dotenv from 'dotenv';
import {
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  createAudioPlayer,
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
} from '@discordjs/voice';
import { Guild, GuildMember, GuildMemberManager, GuildMemberRoleManager, Role } from 'discord.js';

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
      guild: Guild;
      members: GuildMemberManager;
    },
  ) {
    let newUserChannel = newState.channelId;
    let oldUserChannel = oldState.channelId;
    dotenv.config();
    const bot = process.env.BOT;
    let guildId = newState.guild.id;
    if (oldUserChannel == null && newUserChannel != null && newState.member.id != bot) {
      try {
        const roles = await newState.guild.roles.cache;
        var role: string | Role | undefined;
        let members = await newState.guild.members.cache;
        if (
          (role = roles?.find(
            (element: { name: string }) => element.name == 'Chonkiest Virgin the World Has Ever Seen',
          ))
        ) {
          let roley = role.id.toString();
          let mem = members.find((member) => member.roles.cache.has(roley) === true);
          newState.guild.voiceAdapterCreator;
          console.log(mem?.id);
          console.log(newState.member.id);
          if (mem?.id == newState.member.id) {
            const connection = joinVoiceChannel({
              channelId: newState.channelId,
              guildId: newState.guild.id,
              adapterCreator: newState.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
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
          } else {
            //let test = newState.member.id;
            //console.log(test);
          }
        }

        //await orm.em.flush();
      } catch (e) {
        // Something Something Josh dies inside
      }
    }
  },
};
