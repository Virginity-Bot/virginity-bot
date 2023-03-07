import {
  Injectable,
  Logger,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import {
  Command,
  EventParams,
  Handler,
  InteractionEvent,
} from '@discord-nestjs/core';
import { SlashCommandPipe } from '@discord-nestjs/common';
import {
  CommandInteraction,
  Message,
  MessagePayload,
  PermissionFlagsBits,
} from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { RulesService } from '../rules.service';
import { TimingLogInterceptor } from '../interceptors/logging.interceptor';
import { ValidationErrorFilter } from '../filters/validation-error.filter';
import { CatchallErrorFilter } from '../filters/catchall-error.filter';
import { GuildEntity } from 'src/entities/guild/guild.entity';

@Command({
  name: 'rules',
  description: `Rules for Virginity Bot on your server.`,
  defaultMemberPermissions: PermissionFlagsBits.SendMessages,
  dmPermission: false,
})
@Injectable()
@UseFilters(CatchallErrorFilter)
@UseInterceptors(TimingLogInterceptor)
export class RulesCommand {
  private readonly logger = new Logger(RulesCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    private readonly rules: RulesService,
  ) {}

  @Handler()
  @UseRequestContext()
  async handler(
    @EventParams() [interaction]: [interaction: CommandInteraction],
  ): Promise<MessagePayload> {
    if (interaction.guildId == null || interaction.guild == null) {
      this.logger.error([`interaction.guildId was null somehow`, interaction]);
      throw new Error(`interaction.guildId was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    }

    const guild_ent = await this.guilds.findOneOrFail(interaction.guildId);

    const rulesBoard = await this.rules.buildRulesboardEmbed(guild_ent);

    return new MessagePayload(interaction.channel, { embeds: [rulesBoard] });
  }
}
