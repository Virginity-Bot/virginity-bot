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
  Param,
  ParamType,
} from '@discord-nestjs/core';
import { SlashCommandPipe } from '@discord-nestjs/common';
import {
  AttachmentBuilder,
  CommandInteraction,
  EmbedBuilder,
  Message,
  MessagePayload,
  PermissionFlagsBits,
} from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { RulesService } from '../rules.service';
import { DiscordHelperService } from '../discord-helper.service';
import { TimingLogInterceptor } from '../interceptors/logging.interceptor';
import { ValidationErrorFilter } from '../filters/validation-error.filter';
import { CatchallErrorFilter } from '../filters/catchall-error.filter';
import { GuildEntity } from 'src/entities/guild/guild.entity';

export class CheckScoreDTO {}

@Command({
  name: 'rules',
  description: `Rules for Virginity Bot on your server.`,
  defaultMemberPermissions: PermissionFlagsBits.SendMessages,
  dmPermission: false,
})
@Injectable()
@UseFilters(ValidationErrorFilter, CatchallErrorFilter)
@UseInterceptors(TimingLogInterceptor)
export class RulesCommand {
  private readonly logger = new Logger(RulesCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vc_events: EntityRepository<VCEventEntity>,
    private readonly database: DatabaseService,
    private readonly discord_helper: DiscordHelperService,
    private readonly rulesBoard: RulesService,
  ) {}

  @Handler()
  @UseRequestContext()
  async handler(
    @InteractionEvent(SlashCommandPipe) dto: CheckScoreDTO,
    @EventParams() [interaction]: [interaction: CommandInteraction],
  ): Promise<Message> {
    if (interaction.guildId == null || interaction.guild == null) {
      this.logger.error([`interaction.guildId was null somehow`, interaction]);
      throw new Error(`interaction.guildId was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    }

    await interaction.deferReply();

    const guild_ent = await this.guilds.findOneOrFail(interaction.guildId);

    const rulesBoard = await this.rulesBoard.buildRulesboardEmbed(guild_ent);

    return interaction.followUp(
      new MessagePayload(interaction.channel, { embeds: [rulesBoard] }),
    );
  }
}
