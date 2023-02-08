import {
  Injectable,
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  Command,
  EventParams,
  Handler,
  IA,
  Param,
  ParamType,
} from '@discord-nestjs/core';
import { SlashCommandPipe, ValidationPipe } from '@discord-nestjs/common';
import {
  CommandInteraction,
  HexColorString,
  MessagePayload,
  PermissionFlagsBits,
} from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { IsHexColor, IsOptional, Length, Matches, Min } from 'class-validator';

import { SchedulingService } from 'src/scheduling/scheduling.service';
import { IsInfrequentCron } from 'src/validators/infrequent-cron.validator';
import { GuildEntity } from 'src/entities/guild';
import { GuildAdminGuard } from '../guards/guild-admin.guard';
import { ValidationErrorFilter } from '../filters/validation-error.filter';
import configuration from 'src/config/configuration';

export class GuildSettingsDTO {
  /** The score multiplier applied when sharing your screen in VC. */
  @Param({
    description:
      'The score multiplier when sharing your screen. Also see `score_multipliers_stack`.',
    required: false,
    type: ParamType.NUMBER,
  })
  @IsOptional()
  @Min(0)
  score_multiplier_screen?: number;

  /** The score multiplier applied when sharing your webcam in VC. */
  @Param({
    description:
      'The score multiplier applied when sharing your webcam. Also see `score_multipliers_stack`.',
    required: false,
    type: ParamType.NUMBER,
  })
  @IsOptional()
  @Min(0)
  score_multiplier_camera?: number;

  /** The score multiplier applied when gaming in VC. */
  @Param({
    description:
      'The score multiplier applied when gaming. Also see `score_multipliers_stack`.',
    required: false,
    type: ParamType.NUMBER,
  })
  @IsOptional()
  @Min(0)
  score_multiplier_gaming?: number;

  /** Whether or not score multipliers should stack, or use the highest value. */
  @Param({
    description:
      'Whether or not score multipliers should stack, or use the highest value.',
    required: false,
    type: ParamType.BOOLEAN,
  })
  score_multipliers_stack?: boolean;

  /**
   * A schedule for when to reset everyone's scores.
   * Uses CRON-style denotation.
   */
  @Param({
    description: `A schedule for when to reset everyone's scores. Uses CRON-style denotation.`,
    required: false,
    type: ParamType.STRING,
  })
  @IsOptional()
  @IsInfrequentCron()
  score_reset_schedule?: string;

  /** Whether or not to reset scores on a schedule. */
  @Param({
    description: 'Whether or not to reset scores on a schedule.',
    required: false,
    type: ParamType.BOOLEAN,
  })
  score_reset_enabled?: boolean;

  /** The name of the bot's text channel. */
  @Param({
    description: `The name of the bot's text channel.`,
    required: false,
    type: ParamType.STRING,
  })
  @IsOptional()
  @Length(1)
  channel_name?: string;

  /** The description of the bot's text channel. */
  @Param({
    description: `The description of the bot's text channel.`,
    required: false,
    type: ParamType.STRING,
  })
  @IsOptional()
  @Length(1)
  channel_description?: string;

  /** The name of the biggest virgin's role. */
  @Param({
    description: `The name of the biggest virgin's role.`,
    required: false,
    type: ParamType.STRING,
  })
  @IsOptional()
  @Length(1)
  role_name?: string;

  /** The color of the biggest virgin's role. */
  @Param({
    description: `The color of the biggest virgin's role.`,
    required: false,
    type: ParamType.STRING,
  })
  @IsOptional()
  @IsHexColor()
  role_color?: HexColorString;

  /** An emoji to adorn the biggest virgin's role. */
  @Param({
    description: `An emoji to adorn the biggest virgin's role.`,
    required: false,
    type: ParamType.STRING,
  })
  @IsOptional()
  @Length(1, 1, { message: '`role_emoji` must be a single character' })
  @Matches(/^\p{Extended_Pictographic}$/u, {
    message: '`role_emoji` must be an emoji',
  })
  role_emoji?: string;

  /** Whether or not custom intro songs should be enabled. */
  @Param({
    description: `Whether or not custom intro songs should be enabled.`,
    required: false,
    type: ParamType.BOOLEAN,
  })
  @IsOptional()
  custom_intros_enabled?: boolean;

  /** The maximum duration in seconds that a custom intro song can play. */
  @Param({
    description: `The maximum duration in seconds that a custom intro song can play.`,
    required: false,
    type: ParamType.INTEGER,
  })
  @IsOptional()
  custom_intros_max_duration_s?: number;
}

@Command({
  name: 'guild-settings',
  description: `Changes your guild's settings for Virginity Bot.`,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  dmPermission: false,
})
@Injectable()
@UseFilters(ValidationErrorFilter)
export class GuildSettingsCommand {
  private readonly logger = new Logger(GuildSettingsCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    private readonly scheduling: SchedulingService,
  ) {}

  @Handler()
  @UseFilters(ValidationErrorFilter)
  @UsePipes(SlashCommandPipe, ValidationPipe)
  @UseGuards(GuildAdminGuard)
  @UseRequestContext()
  async handler(
    @IA() dto: GuildSettingsDTO,
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

    const guild_ent = await this.guilds.findOneOrFail(interaction.guild.id);

    const messages: string[] = [];

    guild_ent.score.multiplier.camera =
      dto.score_multiplier_camera ?? guild_ent.score.multiplier.camera;
    guild_ent.score.multiplier.gaming =
      dto.score_multiplier_gaming ?? guild_ent.score.multiplier.gaming;
    guild_ent.score.multiplier.screen =
      dto.score_multiplier_screen ?? guild_ent.score.multiplier.screen;

    guild_ent.score.multipliers_stack =
      dto.score_multipliers_stack ?? guild_ent.score.multipliers_stack;

    guild_ent.score.reset_enabled =
      dto.score_reset_enabled ?? guild_ent.score.reset_enabled;
    guild_ent.score.reset_schedule =
      dto.score_reset_schedule ?? guild_ent.score.reset_schedule;

    guild_ent.channel.name = dto.channel_name ?? guild_ent.channel.name;
    guild_ent.channel.description =
      dto.channel_description ?? guild_ent.channel.description;

    guild_ent.role.name = dto.role_name ?? guild_ent.role.name;
    guild_ent.role.color = dto.role_color ?? guild_ent.role.color;
    guild_ent.role.emoji = dto.role_emoji ?? guild_ent.role.emoji;

    guild_ent.intro.custom_enabled =
      dto.custom_intros_enabled ?? guild_ent.intro.custom_enabled;
    guild_ent.intro.max_duration_s =
      dto.custom_intros_max_duration_s ?? guild_ent.intro.max_duration_s;

    if (
      (dto.custom_intros_max_duration_s ?? 0) >
      configuration.audio.custom_intro.max_dur_s
    ) {
      messages.push(
        `Virginity Bot's maximum allowed intro is ${configuration.audio.custom_intro.max_dur_s}.`,
      );
    }

    await this.guilds.flush();

    if (dto.score_reset_enabled != null || dto.score_reset_schedule != null) {
      await this.scheduling.scheduleResets();
      this.logger.debug(
        `Re-scheduled cronjobs for guild ${interaction.guild.id}`,
      );
    }

    messages.push(this.generateUpdateMessage(dto));

    return new MessagePayload(interaction.channel, {
      content: messages.join('\n'),
    });
  }

  generateUpdateMessage(dto: GuildSettingsDTO): string {
    return `Updated ${Object.entries(dto)
      .filter(([k, v]) => v != null)
      .map(([k, v]) => `\`${k}\``)
      .join(', ')}`;
  }
}
