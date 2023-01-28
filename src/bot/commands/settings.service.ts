import { Injectable, Logger } from '@nestjs/common';
import {
  Activity,
  ActivityType,
  Attachment,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  DiscordAPIError,
  Events,
  Guild,
  GuildMember,
  PermissionsBitField,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import configuration from 'src/config/configuration';
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { userLogHeader } from 'src/utils/logs';
import { InjectRepository } from '@mikro-orm/nestjs';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { EntityRepository } from '@mikro-orm/postgresql';
import { StorageService } from 'src/storage/storage.service';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { createHash } from 'crypto';

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
  ) {}

  // @UseRequestContext()
  async saveIntroSong(
    target_user_id: string,
    attachment: Attachment | null,
    user: User,
    guild: Guild,
  ): Promise<void> {
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

    // TODO: Check if the audio clip is under the length limit

    const file = await this.getAttachmentContent(attachment);

    const hash = await createHash('sha256').update(file).digest('base64url');

    const intro_song_ent = await this.intro_songs
      .findOne({ hash })
      .then(async (ent) => {
        // Check if this file has already been uploaded
        if (ent != null) {
          return ent;
        } else {
          // Upload it if it hasn't been

          const extension = attachment.name?.split('.').at(-1) ?? '';
          // TODO(2): convert audio to OPUS
          // TODO(0): normalize audio level
          const uri = await this.storage.storeFile(extension, hash, file);

          const new_ent = this.intro_songs.create({
            hash,
            name: attachment.name ?? hash,
            uri,
            mime_type: attachment.contentType,
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

  /** Retrieves the content of an attachment */
  getAttachmentContent(attachment: Attachment) {
    return firstValueFrom(
      this.http.get<Buffer>(attachment.url, { responseType: 'arraybuffer' }),
    ).then((res) => res.data);
  }
}
