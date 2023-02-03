import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  Command,
  EventParams,
  Handler,
  InteractionEvent,
  Param,
  ParamType,
} from '@discord-nestjs/core';
import { SlashCommandPipe } from '@discord-nestjs/common';
import {
  CommandInteraction,
  MessagePayload,
  PermissionFlagsBits,
} from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { HttpService } from '@nestjs/axios';

import { VirginEntity } from 'src/entities/virgin.entity';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { StorageService } from 'src/storage/storage.service';
import { SettingsService, UserFacingError } from './settings.service';
import {
  GuildAdminIfParam,
  GuildAdminIfParamGuard,
} from '../guards/guild-admin-if-param.guard';

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
  defaultMemberPermissions: PermissionFlagsBits.SendMessages,
})
@Injectable()
export class SettingsCommand {
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

  @Handler()
  @GuildAdminIfParam('virgin')
  @UseGuards(GuildAdminIfParamGuard)
  @UseRequestContext()
  async handler(
    @InteractionEvent(SlashCommandPipe) dto: SettingsDTO,
    @EventParams() [interaction]: [interaction: CommandInteraction],
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

    interaction.channel.sendTyping();

    if (dto.intro_song_file != null) {
      const attachment = await interaction.options.get('intro_song', false)
        ?.attachment;

      if (attachment == null) {
        return new MessagePayload(interaction.channel, {
          content: 'An unknown error occurred.',
        });
      }

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
