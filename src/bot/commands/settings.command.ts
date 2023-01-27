import { Injectable, Logger } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
// import { fetch } from 'node-fetch';
import { StorageService } from '../../storage/storage.service';
import {
  Command,
  CommandExecutionContext,
  DiscordCommand,
  DiscordTransformedCommand,
  Param,
  ParamType,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes,
} from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  MessagePayload,
  ModalBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { HttpModule, HttpService } from '@nestjs/axios';

import { VirginEntity } from 'src/entities/virgin.entity';
import { firstValueFrom } from 'rxjs';

export class SettingsDTO {
  @Param({
    name: 'virgin',
    description: `The user who's settings to modify.`,
    required: false,
    type: ParamType.USER,
  })
  virgin?: string;

  /**
   * Identifier
   */
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
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    private readonly http: HttpService,
  ) {}

  async handler(
    @Payload() dto: SettingsDTO,
    { interaction }: TransformedCommandExecutionContext,
  ): Promise<MessagePayload> {
    if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    }

    // debugger;
    // Check if file exists, Should probably run a check to see if it also
    // Hits other requirements, file type, size etc
    if (dto.intro_song_file != null) {
      // const introMusic = dto.intro_song_file;
      const attachment = await interaction.options.getAttachment(
        'intro_song',
        false,
      );

      if (attachment == null) {
        this.logger.warn('some warning');
        return new MessagePayload(interaction.channel, {
          content: 'some error',
        });
      }

      const file = await firstValueFrom(
        this.http.get<Buffer>(attachment.url, { responseType: 'arraybuffer' }),
      ).then((res) => res.data);
      // TODO: Add check for file type and size.

      return new MessagePayload(interaction.channel, {
        content: `Your settings have been updated.`,
      });
    }
    // Send Data S3 and reply w/ confirmation and properly assign to entity in db
    else {
      return new MessagePayload(interaction.channel, {
        content: `No File was received...`,
      });
    }
  }
}
