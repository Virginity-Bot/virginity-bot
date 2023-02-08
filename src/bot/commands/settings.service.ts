import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Attachment, Guild, User } from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { MikroORM } from '@mikro-orm/core';
import { firstValueFrom } from 'rxjs';
import { minutesToMilliseconds, secondsToMilliseconds } from 'date-fns';

import configuration from 'src/config/configuration';
import { VirginEntity } from 'src/entities/virgin.entity';
import { userLogHeader } from 'src/utils/logs';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { StorageService } from 'src/storage/storage.service';
import { AudioService } from '../audio.service';

export class UserFacingError extends Error {}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly http: HttpService,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(IntroSongEntity)
    private readonly intro_songs: EntityRepository<IntroSongEntity>,
    private readonly storage: StorageService,
    private readonly audio: AudioService,
  ) {}

  async saveIntroSong(
    target_user_id: string,
    attachment: Attachment | null,
    make_public: boolean,
    user: User,
    guild: Guild,
    guild_max_dur_s: number,
  ): Promise<IntroSongEntity> {
    if (attachment == null) {
      this.logger.warn(
        'Failed to retrieve intro_song attachment when one was expected',
      );
      throw new UserFacingError('An error occurred retrieving your file.');
    }

    // Check if the file's contentType is supported
    this.validateMimeType(attachment, user, guild);

    // Check if the file is under the size limit
    this.validateFileSize(attachment, user, guild);

    const file = await this.getAttachmentContent(attachment);

    // Check if the audio clip is under the length limit
    const intro_duration_s = await this.validateAudioDuration(
      file,
      user,
      guild,
      Math.min(guild_max_dur_s, configuration.audio.custom_intro.max_dur_s),
    );

    const hash = await createHash('sha256').update(file).digest('base64url');

    const intro_song_ent = await this.intro_songs
      .findOne({ hash })
      .then(async (ent) => {
        // Check if this file has already been uploaded
        if (ent != null) {
          return ent;
        } else {
          // Upload it if it hasn't been

          // const extension = attachment.name?.split('.').at(-1) ?? '';
          const norm_file = await this.audio.normalizeLoudness(file);
          const uri = await this.storage.storeFile('opus', hash, norm_file);
          const intro_timeout_m =
            this.audio.calculateTimeoutMinutes(intro_duration_s);

          const new_ent = this.intro_songs.create({
            hash,
            name: attachment.name ?? hash,
            uri,
            mime_type: attachment.contentType,
            duration_ms: secondsToMilliseconds(intro_duration_s),
            computed_timeout_ms: minutesToMilliseconds(intro_timeout_m),
            public: make_public,
          } as IntroSongEntity);

          await this.intro_songs.persistAndFlush(new_ent);
          return new_ent;
        }
      });

    // Link the user to the intro song
    await this.virgins.nativeUpdate(
      {
        id: target_user_id,
        guild: guild.id,
      },
      { intro_song: intro_song_ent },
    );
    return intro_song_ent;
  }

  /** @throws if the file is too large */
  validateFileSize(attachment: Attachment, user: User, guild: Guild): void {
    if (attachment.size < configuration.storage.audio.max_file_size_b) {
      return;
    } else {
      this.logger.debug(
        `${userLogHeader(
          user,
          guild,
        )} tried to upload an intro song that was too large (${
          attachment.size
        } bytes).`,
      );
      throw new UserFacingError(
        `Your file is too large. The max allowed size is ${(
          configuration.storage.audio.max_file_size_b / 1024
        ).toFixed(0)} KiB.`,
      );
    }
  }

  /** @throws if the MIME type isn't supported */
  validateMimeType(attachment: Attachment, user: User, guild: Guild): void {
    if (
      attachment.contentType != null &&
      ['audio/mpeg', 'audio/ogg', 'audio/aac'].includes(attachment.contentType)
    ) {
      return;
    } else {
      this.logger.debug(
        `${userLogHeader(
          user,
          guild,
        )} tried to upload an intro song with an invalid contentType ("${
          attachment.contentType
        }").`,
      );
      throw new UserFacingError(
        `${attachment.name} is not a valid audio file.`,
      );
    }
  }

  /**
   * @returns Duration of track in seconds.
   */
  async validateAudioDuration(
    stream: Buffer,
    user: User,
    guild: Guild,
    max_dur_s: number = 30,
  ): Promise<number> {
    const duration_s = await this.audio.getTrackDuration(stream);

    if (duration_s <= max_dur_s) {
      return duration_s;
    } else {
      this.logger.debug(
        `${userLogHeader(
          user,
          guild,
        )} tried to upload an intro song that was over ${max_dur_s} seconds long (${duration_s}s).`,
      );
      throw new UserFacingError(
        `The track you uploaded is ${Math.round(
          duration_s,
        )}s long, which is over the max length of ${max_dur_s}s.`,
      );
    }
  }

  /** Retrieves the content of an attachment */
  getAttachmentContent(attachment: Attachment) {
    return firstValueFrom(
      this.http.get<Buffer>(attachment.url, { responseType: 'arraybuffer' }),
    ).then((res) => res.data);
  }
}
