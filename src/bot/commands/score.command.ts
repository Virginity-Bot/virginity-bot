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
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Virgin } from 'src/entities/virgin.entity';

@Command({
  name: 'score',
  description: 'Replies with the users score.',
})
@Injectable()
export class ScoreCommand implements DiscordCommand {
  constructor(private readonly virginsRepo: EntityRepository<Virgin>) {}
  async handler(
    interaction: ChatInputCommandInteraction<CacheType>,
    ctx: CommandExecutionContext<
      ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>
    >,
  ): Promise<MessagePayload> {
    const userScore = this.virginsRepo.findOneOrFail({
      snowflake: { $eq: interaction.member.user.id },
    });
    return new MessagePayload(interaction.channel, {
      content: `You Score is: ${userScore}!`,
    });
  }
}
