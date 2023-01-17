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

@Command({
  name: 'score',
  description: 'Replies with the users score.',
})
@Injectable()
export class ScoreCommand implements DiscordCommand {
  async handler(
    interaction: ChatInputCommandInteraction<CacheType>,
    ctx: CommandExecutionContext<
      ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>
    >,
  ): Promise<MessagePayload> {
    return new MessagePayload(interaction.channel, {
      content: 'You Score is: ∞!',
    });
  }
}
