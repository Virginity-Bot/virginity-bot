import { Injectable, Logger } from '@nestjs/common';
import {
  Command,
  CommandExecutionContext,
  DiscordCommand,
} from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  MessagePayload,
  StringSelectMenuInteraction,
} from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';

@Command({
  name: 'score',
  description: `Replies with the virgin's score.`,
})
@Injectable()
export class ScoreCommand implements DiscordCommand {
  private readonly logger = new Logger(ScoreCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vc_events: EntityRepository<VCEventEntity>,
    private readonly database: DatabaseService,
  ) {}

  @UseRequestContext()
  async handler(
    interaction: ChatInputCommandInteraction<CacheType>,
    ctx: CommandExecutionContext<
      ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>
    >,
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

    const timestamp = new Date(interaction.createdTimestamp);

    const in_prog_event = await this.database.closeEvent(
      interaction.guild,
      interaction.member,
      timestamp,
    );

    if (in_prog_event != null) {
      await this.database.openEvent(in_prog_event, null, timestamp);
      await this.vc_events.flush();
    }

    const caller = await this.virgins.findOne([
      interaction.member.user.id,
      interaction.guild.id,
    ]);

    // TODO(2): add flavor text
    return new MessagePayload(interaction.channel, {
      content: `Your score is: ${caller?.cached_dur_in_vc ?? 0}.`,
    });
  }
}
