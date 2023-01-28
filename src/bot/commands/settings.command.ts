import { Injectable, Logger } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Param,
  ParamType,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes,
} from '@discord-nestjs/core';
import { MessagePayload } from 'discord.js';
import {
  MikroORM,
  NotFoundError,
  RequiredEntityData,
  UseRequestContext,
} from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { VirginEntity } from 'src/entities/virgin.entity';
import { userLogHeader } from 'src/utils/logs';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { StorageService } from 'src/storage/storage.service';
import { VirginSettingsEntity } from 'src/entities/virgin-settings.entity';
import configuration from 'src/config/configuration';
import { createHash } from 'crypto';

export class SettingsDTO {
  /** User snowflake */
  @Param({
    name: 'virgin',
    description: `The user who's settings to modify.`,
    required: false,
    type: ParamType.USER,
  })
  virgin_to_modify?: string;

  /** Attachment snowflake */
  @Param({
    name: 'intro_song',
    // TODO(2): add info about limitations (file size, length, etc)
    description: 'Your intro song file. (8MB or less unless boosted)',
    required: false,
    type: ParamType.ATTACHMENT,
  })
  intro_song_file?: string;
}

@Command({
  name: 'settings',
  description: `Changes a user's settings with Virginity Bot`,
})
@UsePipes(TransformPipe)
@Injectable()
export class SettingsCommand implements DiscordTransformedCommand<SettingsDTO> {
  private readonly logger = new Logger(SettingsCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(VirginSettingsEntity)
    private readonly virgin_settings: EntityRepository<VirginSettingsEntity>,
    @InjectRepository(IntroSongEntity)
    private readonly intro_songs: EntityRepository<IntroSongEntity>,
    private readonly http: HttpService,
    private readonly storage: StorageService,
  ) {}

  @UseRequestContext()
  async handler(
    @Payload() dto: SettingsDTO,
    { interaction }: TransformedCommandExecutionContext,
  ): Promise<MessagePayload> {
    if (interaction.member == null) {
      this.logger.error([`interaction.member was null somehow`, interaction]);
      throw new Error(`interaction.member was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    } else if (interaction.guild == null) {
      this.logger.error([`interaction.guild was null somehow`, interaction]);
      throw new Error(`interaction.guild was null somehow`);
    }

    // const virgin_settings_ent = await this.virgin_settings
    //   .findOneOrFail({
    //     virgin_guilds: { id: dto.virgin_to_modify ?? interaction.user.id },
    //   })
    //   .catch((err) => {
    //     if (err instanceof NotFoundError) {
    //       return this.virgin_settings.create({
    //         // virgin_snowflake: dto.virgin_to_modify ?? interaction.user.id,
    //         virgin_guilds: [
    //           dto.virgin_to_modify ?? interaction.user.id,
    //           interaction.guild?.id,
    //         ],
    //         // virgin_guilds: [dto.virgin_to_modify ?? interaction.user.id],
    //       } as Partial<RequiredEntityData<VirginSettingsEntity>> as VirginSettingsEntity);
    //     } else {
    //       throw err;
    //     }
    //   });
    // console.log('HOLY CRAP WE HAVE SOME SETTINGS');

    // Check if file exists, Should probably run a check to see if it also
    // Hits other requirements, file type, size etc
    if (dto.intro_song_file != null) {
      // const introMusic = dto.intro_song_file;
      const attachment = await interaction.options.getAttachment(
        'intro_song',
        false,
      );

      if (attachment == null) {
        this.logger.warn(
          'Failed to retrieve intro_song attachment when one was expected',
        );
        return new MessagePayload(interaction.channel, {
          content: 'An error occurred retrieving your file.',
        });
      }

      // Check if the file's contentType is supported
      if (
        attachment.contentType == null ||
        !['audio/mpeg', 'audio/ogg'].includes(attachment.contentType)
      ) {
        this.logger.debug(
          `${userLogHeader(
            interaction.member.user,
            interaction.guild,
          )} tried to upload an intro song with an invalid contentType ("${
            attachment.contentType
          }").`,
        );
        return new MessagePayload(interaction.channel, {
          content: `${attachment.name} is not a valid audio file.`,
        });
      }

      // Check if the file is under the size limit
      if (attachment.size > configuration.storage.audio.max_file_size_b) {
        this.logger.debug(
          `${userLogHeader(
            interaction.member.user,
            interaction.guild,
          )} tried to upload an intro song that was too large (${
            attachment.size
          } bytes).`,
        );
        return new MessagePayload(interaction.channel, {
          content: `Your file is too large. The max allowed size is ${(
            configuration.storage.audio.max_file_size_b / 1024
          ).toFixed(0)} KiB.`,
        });
      }

      // TODO: Check if the audio clip is under the length limit

      const file = await firstValueFrom(
        this.http.get<Buffer>(attachment.url, { responseType: 'arraybuffer' }),
      ).then((res) => res.data);

      const hash = await createHash('sha256').update(file).digest('base64url');

      // Check if this file has already been uploaded
      const intro_song_ent = await this.intro_songs
        .findOne({ hash })
        .then(async (ent) => {
          if (ent != null) {
            return ent;
          } else {
            // TODO: handle attachment not having a name
            const extension = attachment.name?.split('.').at(-1) ?? '';
            const uri = await this.storage.storeFile(extension, hash, file);

            const new_ent = this.intro_songs.create({
              hash,
              // TODO: handle attachment not having a name
              name: attachment.name ?? 'some-name',
              uri,
            } as IntroSongEntity);

            await this.intro_songs.persistAndFlush(new_ent);
            return new_ent;
          }
        });

      await this.virgin_settings.nativeUpdate(
        {
          virgin_guilds: [
            dto.virgin_to_modify ?? interaction.user.id,
            interaction.guild.id,
          ],
        },
        { intro_song: intro_song_ent },
      );

      // TODO(3): this prevents other settings from being applied at the same time.
      return new MessagePayload(interaction.channel, {
        content: `Your settings have been updated.`,
      });
    } else {
      return new MessagePayload(interaction.channel, {
        content: `No File was received...`,
      });
    }
  }
}
