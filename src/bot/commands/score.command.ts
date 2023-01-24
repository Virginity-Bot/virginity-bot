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
import { Injectable, Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { VirginEntity } from 'src/entities/virgin.entity';

@Command({
  name: 'score',
  description: 'Replies with the users score.',
})
@Injectable()
export class ScoreCommand implements DiscordCommand {
  private readonly logger = new Logger(ScoreCommand.name);

  constructor(private readonly virginsRepo: EntityRepository<VirginEntity>) {}
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
    }

    const userScore = this.virginsRepo.findOneOrFail({
      id: interaction.member.user.id,
    });
    return new MessagePayload(interaction.channel, {
      content: `You Score is: ${userScore}!`,
    });
  }
}
