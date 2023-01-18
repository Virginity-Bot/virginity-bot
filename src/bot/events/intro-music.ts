import { Injectable } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import { Client, VoiceState } from 'discord.js';
import {
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  createAudioPlayer,
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
} from '@discordjs/voice';

@Injectable()
export class IntroMusic {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  @On('voiceStateUpdate')
  voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    console.log('Someone did a thing in VC?');
    console.log(arguments);

    if (
      new_state.channelId != null &&
      new_state.channelId != old_state.channelId
    ) {
      const connection = joinVoiceChannel({
        channelId: new_state.channelId,
        guildId: new_state.guild.id,
        adapterCreator: new_state.guild
          .voiceAdapterCreator as DiscordGatewayAdapterCreator,
      });
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      const resource = createAudioResource(
        'assets/assets_entrance_theme.opus',
        {
          metadata: {
            title: 'The Biggest Virgin!',
          },
        },
      );
      resource.volume?.setVolume(2);
      player.play(resource);
      connection.subscribe(player);
      player.on(AudioPlayerStatus.Idle, () => {
        player.stop();
        connection.destroy();
      });
    }
  }
}
