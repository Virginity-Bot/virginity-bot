import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
  InteractionEvent,
  On,
  Param,
  ParamType,
} from '@discord-nestjs/core';
import { SlashCommandPipe } from '@discord-nestjs/common';
import {
  AutocompleteInteraction,
  CommandInteraction,
  Events,
  MessagePayload,
  PermissionFlagsBits,
  Client,
  ApplicationCommandOptionChoiceData,
} from 'discord.js';
import { FilterQuery, MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Duration, formatDuration, secondsToMilliseconds } from 'date-fns';

import configuration from 'src/config/configuration';
import { GuildEntity } from 'src/entities/guild';
import { VirginEntity } from 'src/entities/virgin.entity';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { pascal_spaces, possess } from 'src/utils/string-transformers';
import { SettingsService, UserFacingError } from './settings.service';
import {
  GuildAdminIfParam,
  GuildAdminIfParamGuard,
} from '../guards/guild-admin-if-param.guard';
import { IsAutocompleteInteractionGuard } from '../guards/is-autocomplete-interaction.guard';

const intro_song_file = 'intro_song_file';

export class SettingsDTO {
  /** User snowflake */
  @Param({
    name: 'virgin',
    description: `The user who's settings to modify.`,
    required: false,
    type: ParamType.USER,
  })
  virgin_to_modify?: string;

  @Param({
    name: 'intro_song',
    description: 'Pick from intro songs other users have uploaded.',
    required: false,
    type: ParamType.STRING,
    autocomplete: true,
  })
  intro_song_hash: string;

  /** Attachment snowflake */
  @Param({
    name: intro_song_file,
    description: 'Your intro song file.',
    required: false,
    type: ParamType.ATTACHMENT,
  })
  intro_song_file_snowflake?: string;

  @Param({
    description:
      'Whether or not to make your new intro song public (default true). Cannot be changed later.',
    required: false,
    type: ParamType.BOOLEAN,
  })
  make_new_intro_public: boolean = true;

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
    @InjectRepository(IntroSongEntity)
    private readonly intro_songs: EntityRepository<IntroSongEntity>,
    private readonly settings: SettingsService,
    @InjectDiscordClient()
    private readonly client: Client,
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

    if (dto.intro_song_hash != null) {
      if (!guild_ent.intro.custom_enabled) {
        messages.push(`Custom intro songs are disabled in this server.`);
      } else {
        const intro_song_ent = await this.intro_songs.findOne({
          hash: dto.intro_song_hash,
          public: true,
        });
        if (intro_song_ent == null) {
          messages.push('Could not find the requested song.');
        } else if (
          intro_song_ent.duration_ms >
          secondsToMilliseconds(guild_ent.intro.max_duration_s)
        ) {
          messages.push('Selected song is too long.');
        } else {
          target_user.intro_song = intro_song_ent;
          await this.virgins.flush();

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
        }
      }
    } else if (dto.intro_song_file_snowflake != null) {
      if (!guild_ent.intro.custom_enabled) {
        messages.push(`Custom intro songs are disabled in this server.`);
      } else {
        const attachment = interaction.options.get(
          intro_song_file,
          false,
        )?.attachment;

        try {
          if (attachment == null) {
            this.logger.warn(
              `Could not find attachment ${dto.intro_song_file_snowflake}`,
            );
            throw new UserFacingError('An unknown error occurred.');
          }

          const intro_song_ent = await this.settings.saveIntroSong(
            target_user_snowflake,
            attachment,
            dto.make_new_intro_public,
            interaction.user,
            interaction.guild,
            guild_ent.intro.max_duration_s,
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
    }

    interaction.followUp(
      new MessagePayload(interaction.channel, {
        content: messages.join('\n'),
      }),
    );
  }

  @On(Events.InteractionCreate)
  @UseGuards(IsAutocompleteInteractionGuard)
  @UseRequestContext()
  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    if (interaction.member == null) {
      this.logger.error([`interaction.member was null somehow`, interaction]);
      throw new Error(`interaction.member was null somehow`);
    } else if (interaction.guild == null) {
      this.logger.error([`interaction.guild was null somehow`, interaction]);
      throw new Error(`interaction.guild was null somehow`);
    }

    const guild_ent = await this.guilds.findOneOrFail({
      id: interaction.guild.id,
    });

    const query: FilterQuery<IntroSongEntity> = {
      public: true,
      duration_ms: {
        $lte: secondsToMilliseconds(
          Math.min(
            guild_ent.intro.max_duration_s,
            configuration.audio.custom_intro.max_dur_s,
          ),
        ),
      },
    };

    const search = interaction.options.get('intro_song', false);
    if (search?.value != null && search.focused === true) {
      query.name = { $ilike: `%${search.value}%` };
    }

    const intro_songs = await this.intro_songs.find(query, {
      limit: 10,
      orderBy: [{ created_at: -1 }],
    });

    return interaction.respond(
      intro_songs.map<ApplicationCommandOptionChoiceData<string | number>>(
        (song) => ({ name: song.name, value: song.hash }),
      ),
    );
  }
}
