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
import { Duration, formatDuration } from 'date-fns';

import { VirginEntity } from 'src/entities/virgin.entity';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { pascal_spaces, possess } from 'src/utils/string-transformers';
import { StorageService } from 'src/storage/storage.service';
import { SettingsService, UserFacingError } from './settings.service';
import {
  GuildAdminIfParam,
  GuildAdminIfParamGuard,
} from '../guards/guild-admin-if-param.guard';
import { GuildEntity } from 'src/entities/guild';

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
  intro_song_snowflake?: string;

  @Param({
    description: 'Clears your custom intro song, resetting it to default.',
    required: false,
    type: ParamType.BOOLEAN,
  })
  clear_intro_song?: boolean;
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
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    private readonly settings: SettingsService,
  ) {}

  @Handler()
  @GuildAdminIfParam('virgin')
  @UseGuards(GuildAdminIfParamGuard)
  @UseRequestContext()
  async handler(
    @InteractionEvent(SlashCommandPipe) dto: SettingsDTO,
    @EventParams() [interaction]: [interaction: CommandInteraction],
  ): Promise<void> {
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

    await interaction.deferReply();
    const messages: string[] = [];

    const target_user_snowflake = dto.virgin_to_modify ?? interaction.user.id;
    const target_user = await this.virgins.findOneOrFail({
      id: target_user_snowflake,
    });
    const target_user_name =
      dto.virgin_to_modify != null
        ? possess(target_user.nickname ?? target_user.username)
        : 'your';
    const guild_ent = await this.guilds.findOneOrFail({
      id: interaction.guild.id,
    });

    if (dto.intro_song_snowflake != null) {
      if (!guild_ent.intro.custom_enabled) {
        messages.push(`Custom intro songs are disabled in this server.`);
      } else {
        const attachment = await interaction.options.get('intro_song', false)
          ?.attachment;

        try {
          if (attachment == null) {
            this.logger.warn(
              `Could not find attachment ${dto.intro_song_snowflake}`,
            );
            throw new UserFacingError('An unknown error occurred.');
          }

          const intro_song_ent = await this.settings.saveIntroSong(
            target_user_snowflake,
            attachment,
            interaction.user,
            interaction.guild,
          );
          const intro_song_timeout = new Date(
            intro_song_ent.computed_timeout_ms,
          );
          const duration: Duration = {
            years: intro_song_timeout.getUTCFullYear() - 1970,
            months: intro_song_timeout.getUTCMonth(),
            days: intro_song_timeout.getUTCDate() - 1,
            hours: intro_song_timeout.getUTCHours(),
            minutes: intro_song_timeout.getUTCMinutes(),
            seconds: intro_song_timeout.getUTCSeconds(),
          };

          messages.push(
            `Intro song updated. ${pascal_spaces(
              target_user_name,
            )} intro cool-down will now be ${formatDuration(duration, {
              delimiter: ', ',
            })}.`,
          );
        } catch (e) {
          if (e instanceof UserFacingError) {
            messages.push(e.message);
          } else {
            this.logger.error(e);
            messages.push('An unknown error occurred.');
          }
        }
      }
    }

    if (dto.clear_intro_song) {
      await this.virgins.nativeUpdate(
        { id: target_user_snowflake },
        { intro_song: null },
      );

      messages.push(
        `${pascal_spaces(
          target_user_name,
        )} intro song has been reset to default.`,
      );
    }

    interaction.followUp(
      new MessagePayload(interaction.channel, {
        content: messages.join('\n'),
      }),
    );
  }
}
