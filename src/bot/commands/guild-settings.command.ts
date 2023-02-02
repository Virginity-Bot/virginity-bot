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
import { HexColorString, MessagePayload } from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { GuildEntity } from 'src/entities/guild';
import { SettingsService } from './settings.service';

export class GuildSettingsDTO {
  /** The score multiplier applied when sharing your screen in VC. */
  @Param({
    name: 'score_multiplier_screen_sharing',
    description:
      'The score multiplier when sharing your screen. Also see `score_multipliers_stack`.',
    required: false,
    type: ParamType.NUMBER,
  })
  score_multiplier_screen?: number;

  /** The score multiplier applied when sharing your webcam in VC. */
  @Param({
    name: 'score_multiplier_webcamera',
    description:
      'The score multiplier applied when sharing your webcam. Also see `score_multipliers_stack`.',
    required: false,
    type: ParamType.NUMBER,
  })
  score_multiplier_camera?: number;

  /** The score multiplier applied when gaming in VC. */
  @Param({
    name: 'score_multiplier_gaming',
    description:
      'The score multiplier applied when gaming. Also see `score_multipliers_stack`.',
    required: false,
    type: ParamType.NUMBER,
  })
  score_multiplier_gaming?: number;

  /** Whether or not score multipliers should stack, or use the highest value. */
  @Param({
    name: 'score_multipliers_stack',
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
    name: 'reset_schedule',
    description: `A schedule for when to reset everyone's scores. Uses CRON-style denotation.`,
    required: false,
    type: ParamType.STRING,
  })
  score_reset_schedule?: string;

  /** The name of the bot's text channel. */
  @Param({
    name: 'channel_name',
    description: `The name of the bot's text channel.`,
    required: false,
    type: ParamType.STRING,
  })
  channel_name?: string;

  /** The description of the bot's text channel. */
  @Param({
    name: 'channel_description',
    description: `The description of the bot's text channel.`,
    required: false,
    type: ParamType.STRING,
  })
  channel_description?: string;

  /** The name of the biggest virgin's role. */
  @Param({
    name: 'role_name',
    description: `The name of the biggest virgin's role.`,
    required: false,
    type: ParamType.STRING,
  })
  role_name?: string;

  /** The color of the biggest virgin's role. */
  @Param({
    name: 'role_color',
    description: `The color of the biggest virgin's role.`,
    required: false,
    type: ParamType.STRING,
  })
  role_color?: HexColorString;

  /** An emoji to adorn the biggest virgin's emoji. */
  @Param({
    name: 'role_emoji',
    description: `An emoji to adorn the biggest virgin's emoji.`,
    required: false,
    type: ParamType.STRING,
  })
  role_emoji?: string;
}

@Command({
  name: 'guild-settings',
  description: `Changes your guild's settings for Virginity Bot`,
})
@UsePipes(TransformPipe)
@Injectable()
export class GuildSettingsCommand
  implements DiscordTransformedCommand<GuildSettingsDTO>
{
  private readonly logger = new Logger(GuildSettingsCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    private readonly settings: SettingsService,
  ) {}

  @UseRequestContext()
  async handler(
    @Payload() dto: GuildSettingsDTO,
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

    interaction.channel.sendTyping();

    const guild_ent = await this.guilds.findOneOrFail(interaction.guild.id);

    guild_ent.score.multiplier.camera =
      dto.score_multiplier_camera ?? guild_ent.score.multiplier.camera;
    guild_ent.score.multiplier.gaming =
      dto.score_multiplier_gaming ?? guild_ent.score.multiplier.gaming;
    guild_ent.score.multiplier.screen =
      dto.score_multiplier_screen ?? guild_ent.score.multiplier.screen;

    guild_ent.score.multipliers_stack =
      dto.score_multipliers_stack ?? guild_ent.score.multipliers_stack;

    // TODO: will this will unset a null value?
    guild_ent.score.reset_schedule =
      dto.score_reset_schedule ?? guild_ent.score.reset_schedule;

    guild_ent.channel.name = dto.channel_name ?? guild_ent.channel.name;
    guild_ent.channel.description =
      dto.channel_description ?? guild_ent.channel.description;

    guild_ent.role.name = dto.role_name ?? guild_ent.role.name;
    guild_ent.role.color = dto.role_color ?? guild_ent.role.color;
    guild_ent.role.emoji = dto.role_emoji ?? guild_ent.role.emoji;

    await this.guilds.flush();

    return new MessagePayload(interaction.channel, {
      content: 'Updated guild settings',
    });
  }
}
