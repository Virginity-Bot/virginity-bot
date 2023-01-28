import { createHash } from 'crypto';
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
import configuration from 'src/config/configuration';
import { SettingsService, UserFacingError } from './settings.service';

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
    @InjectRepository(IntroSongEntity)
    private readonly intro_songs: EntityRepository<IntroSongEntity>,
    private readonly http: HttpService,
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
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

    if (dto.intro_song_file != null) {
      const attachment = await interaction.options.getAttachment(
        'intro_song',
        false,
      );

      try {
        await this.settings.saveIntroSong(
          dto.virgin_to_modify ?? interaction.user.id,
          attachment,
          interaction.user,
          interaction.guild,
        );
      } catch (e) {
        if (e instanceof UserFacingError) {
          return new MessagePayload(interaction.channel, {
            content: e.message,
          });
        } else {
          this.logger.error(e);
          return new MessagePayload(interaction.channel, {
            content: 'An unknown error occurred.',
          });
        }
      }

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
