import { Injectable, Logger } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import { Client, Guild, VoiceState } from 'discord.js';
import {
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  createAudioPlayer,
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
} from '@discordjs/voice';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';

@Injectable()
export class IntroMusic {
  private readonly logger = new Logger(IntroMusic.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @On('voiceStateUpdate')
  @UseRequestContext()
  voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    this.logger.log(`Playing intro music maybe?`);

    if (
      new_state.channelId != null &&
      new_state.channelId != old_state.channelId
    ) {
      this.playIntroMusic(new_state.guild, new_state.channelId);
    }
  }

  playIntroMusic(guild: Guild, channel_id: string) {
    const connection = joinVoiceChannel({
      channelId: channel_id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
    });
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    const resource = createAudioResource('assets/assets_entrance_theme.opus', {
      metadata: { title: 'The Biggest Virgin!' },
      inlineVolume: true,
    });
    resource.volume.setVolume(0.3);

    connection.subscribe(player);
    player.play(resource);
    player.on(AudioPlayerStatus.Idle, () => {
      player.stop();
      connection.destroy();
    });
  }
}
