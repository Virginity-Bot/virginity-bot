import {
  ArgumentsHost,
  ExceptionFilter,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CommandInteraction, InteractionReplyOptions } from 'discord.js';

export class CatchallErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchallErrorFilter.name);

  async catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof ForbiddenException) {
      /**
       * Ignore ForbiddenException. It seems to be thrown before handling any
       * command. Not sure what's up with that.
       */
      return;
    }

    this.logger.error(exception);

    const interaction: CommandInteraction = host.getArgs()[0];

    const message: InteractionReplyOptions = {
      content: `An unknown error ocurred.`,
    };

    if (interaction.replied) {
      const original = await interaction.fetchReply();
      if (original.content !== message.content) {
        message.content = `${original.content}\n\nEdit: ${message.content}`;
        await interaction.editReply(message);
      }
    } else if (interaction.deferred) {
      await interaction
        .followUp(message)
        .catch((err) => this.logger.error(err));
    } else {
      await interaction.reply(message).catch((err) => this.logger.error(err));
    }
  }
}
