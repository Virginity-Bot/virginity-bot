import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';

import {
  Injectable,
  Logger,
  UseInterceptors,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  CanActivate,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { On } from '@discord-nestjs/core';
import {
  Events,
  Guild,
  GuildMember,
  VoiceBasedChannel,
  VoiceState,
} from 'discord.js';
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
import { differenceInMilliseconds, millisecondsToSeconds } from 'date-fns';

import { GuildEntity } from 'src/entities/guild/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { StorageService } from 'src/storage/storage.service';
import configuration from 'src/config/configuration';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

type CheckedVoiceState = VoiceState & {
  channel: VoiceBasedChannel;
  member: GuildMember;
};

export class IntroMusicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const [old_state, new_state] = context.getArgs<[VoiceState, VoiceState]>();

    if (
      // user is leaving VC
      new_state.channel == null ||
      // user is switching from one VC to another
      new_state.channelId === old_state.channelId ||
      // user is entering AFK
      new_state.channelId === new_state.guild.afkChannelId ||
      // there is no user
      new_state.member == null
    ) {
      return false;
    }

    return true;
  }
}

@Injectable()
@UseGuards(IntroMusicGuard)
@UseInterceptors(new LoggingInterceptor(IntroMusic.name))
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

  @On(Events.VoiceStateUpdate)
  @UseRequestContext()
  async voiceStateUpdate(old_state: VoiceState, new_state: CheckedVoiceState) {
    const guild_ent = await this.guilds.findOneOrFail(new_state.guild.id);
    if (
      guild_ent.biggest_virgin_role_id == null ||
      new_state.member?.roles.resolve(guild_ent.biggest_virgin_role_id) != null
    ) {
      const virgin = await this.virgins.findOne(
        [new_state.member.id, new_state.guild.id],
        { populate: ['intro_song'] },
      );

      if (virgin == null) {
        return this.playIntroMusic(new_state.guild, new_state.channel.id);
      }

      const now = new Date();
      const ms_since_last_play = Math.abs(
        differenceInMilliseconds(now, virgin.intro_last_played ?? new Date(0)),
      );
      const play_custom_intro =
        guild_ent.intro.custom_enabled &&
        guild_ent.intro.max_duration_s >
          millisecondsToSeconds(virgin.intro_song?.duration_ms ?? 0);
      const timeout_ms = play_custom_intro
        ? virgin.intro_song?.computed_timeout_ms ??
          configuration.audio.default_intro.timeout_ms
        : configuration.audio.default_intro.timeout_ms;

      if (ms_since_last_play >= timeout_ms) {
        if (
          // channel has more than 1 member
          new_state.channel.members.size > 1
        ) {
          virgin.intro_last_played = now;
          await this.virgins.flush();
        }

        return this.playIntroMusic(
          new_state.guild,
          new_state.channel.id,
          play_custom_intro ? virgin.intro_song : undefined,
        );
      }
    }
  }

  /**
   * Plays a virgin's intro song in the specified channel.
   *
   * **NOTE**: The returned promise resolves slightly before the bot has finished
   *  leaving the channel.
   */
  playIntroMusic(
    guild: Guild,
    channel_id: string,
    intro?: IntroSongEntity,
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

      return this.getAudioResource(intro).then((resource) => {
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
      readable = createReadStream(configuration.audio.default_intro.path);
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
