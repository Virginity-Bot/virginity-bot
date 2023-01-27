import { Injectable, Logger } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
import { fetch } from 'node-fetch';
import {
  Command,
  CommandExecutionContext,
  DiscordCommand,
  DiscordTransformedCommand,
  Param,
  ParamType,
  Payload,
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

import { VirginEntity } from 'src/entities/virgin.entity';

export class SettingsDTO {
  @Param({
    name: 'Virgin',
    description: `The user who's settings to modify.`,
    required: false,
    type: ParamType.USER,
  })
  virgin?: string;
  @Param({
    name: 'Intro Song',
    // TODO(2): add info about limitations (file size, length, etc)
    description: 'Your intro song file.',
    required: false,
    type: ParamType.ATTACHMENT,
  })
  intro_song_file: unknown;
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
  ) {}

  async handler(
    @Payload() dto: SettingsDTO,
    { interaction },
  ): Promise<MessagePayload> {
    // debugger;
    // Check if file exists, Should probably run a check to see if it also
    // Hits other requirements, file type, size etc
    if (dto.intro_song_file == null) {
      return new MessagePayload(interaction.channel, {
        content: `No File was received...`,
      });
    }
    // Send Data S3 and reply w/ confirmation and properly assign to entity in db
    else {
      const introMusic = dto.intro_song_file;

      return new MessagePayload(interaction.channel, {
        content: `Your settings have been updated.`,
      });
    }
  }
}
