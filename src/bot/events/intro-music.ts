import { Readable } from 'stream';
import { createReadStream } from 'fs';
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
  AudioResource,
  StreamType,
} from '@discordjs/voice';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { differenceInSeconds } from 'date-fns';
import { GuildEntity } from 'src/entities/guild/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class IntroMusic {
  private readonly logger = new Logger(IntroMusic.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    private readonly storage: StorageService,
  ) {}

  @On('voiceStateUpdate')
  @UseRequestContext()
  async voiceStateUpdate(old_state: VoiceState, new_state: VoiceState) {
    if (
      new_state.channelId == null ||
      new_state.channelId === old_state.channelId ||
      new_state.member == null
    ) {
      return;
    }

    const guild_ent = await this.guilds.findOneOrFail(new_state.guild.id);
    if (
      guild_ent.biggest_virgin_role_id == null ||
      new_state.member?.roles.resolve(guild_ent.biggest_virgin_role_id) != null
    ) {
      const virgin = await this.virgins.findOneOrFail(
        [new_state.member.id, new_state.guild.id],
        { populate: ['intro_song'] },
      );
      const now = new Date();
      const defaultIntro = 4.9;
      if (
        Math.abs(
          differenceInSeconds(now, virgin.intro_last_played ?? new Date(0)),
        ) >= (virgin.intro_song?.computed_timeout ?? defaultIntro)
      ) {
        await this.playIntroMusic(new_state.guild, new_state.channelId, virgin);
        virgin.intro_last_played = now;
        await this.virgins.flush();
      }
    }
  }

  playIntroMusic(
    guild: Guild,
    channel_id: string,
    virgin?: VirginEntity | null,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
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

      return this.getAudioResource(virgin?.intro_song).then((resource) => {
        connection.subscribe(player);
        player.play(resource);
        this.logger.debug('Started playing intro song');

        player.on('error', (err) => {
          this.logger.warn(err, err.stack);
        });
        player.on(AudioPlayerStatus.Idle, () => {
          player.stop();
          connection.destroy();
          this.logger.debug('Finished playing intro song');
          resolve();
        });
      });
    });
  }

  async getAudioResource(intro_song?: IntroSongEntity): Promise<AudioResource> {
    let readable: Readable;

    if (intro_song == null) {
      readable = createReadStream(`assets/entrance_theme.opus`);
    } else {
      try {
        switch (intro_song.protocol) {
          case 's3': {
            readable = await this.storage.getStream(
              intro_song.object_name,
              intro_song.bucket,
            );
            break;
          }
          default:
            this.logger.error(`Unknown URI schema ${intro_song.protocol}`);
            throw new Error(`Unknown URI schema ${intro_song.protocol}`);
        }
      } catch (err) {
        this.logger.warn(err, err.stack);

        // fallback to default intro song
        return this.getAudioResource();
      }
    }

    return createAudioResource(readable, { inputType: StreamType.OggOpus });
  }
}
