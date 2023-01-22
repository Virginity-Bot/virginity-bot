import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Guild, VoiceState } from 'discord.js';
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

import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VirginSettingsEntity } from 'src/entities/virgin-settings.entity';

@Injectable()
export class IntroMusic {
  private readonly logger = new Logger(IntroMusic.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(VirginSettingsEntity)
    private readonly virgin_settings: EntityRepository<VirginSettingsEntity>,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
  ) {}

  @On('voiceStateUpdate')
  @UseRequestContext()
  async voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    if (
      new_state.channelId != null &&
      new_state.channelId != old_state.channelId
    ) {
      const guild_ent = await this.guilds.findOneOrFail(new_state.guild.id);
      if (
        guild_ent.biggest_virgin_role_id == null ||
        new_state.member?.roles.resolve(guild_ent.biggest_virgin_role_id) !=
          null
      ) {
        const virgin_settings = await this.virgin_settings.findOne({
          virgin_guilds: { id: new_state.member!.id },
          // virgin_snowflake: new_state.member!.id,
        });
        await this.playIntroMusic(
          new_state.guild,
          new_state.channelId,
          virgin_settings,
        );
      }
    }
  }

  playIntroMusic(
    guild: Guild,
    channel_id: string,
    virgin_settings?: VirginSettingsEntity | null,
  ): Promise<void> {
    return new Promise<void>((res, rej) => {
      const connection = joinVoiceChannel({
        channelId: channel_id,
        guildId: guild.id,
        adapterCreator:
          guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      });
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });

      const resource = createAudioResource(
        `assets/${virgin_settings?.intro_song ?? 'entrance_theme.opus'}`,
        {
          metadata: { title: 'The Biggest Virgin!' },
          inlineVolume: true,
        },
      );
      resource.volume?.setVolume(0.3);

      connection.subscribe(player);
      player.play(resource);
      player.on(AudioPlayerStatus.Idle, () => {
        player.stop();
        connection.destroy();
        res();
      });
    });
  }
}
