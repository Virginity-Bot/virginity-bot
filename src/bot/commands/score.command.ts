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

    // TODO: account for in-progress VC events
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
