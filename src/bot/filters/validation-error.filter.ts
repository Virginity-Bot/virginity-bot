import { WrongArgsException } from '@discord-nestjs/common';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { CommandInteraction, InteractionReplyOptions } from 'discord.js';

@Catch(WrongArgsException)
export class ValidationErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationErrorFilter.name);

  async catch(exception: WrongArgsException, host: ArgumentsHost) {
    const validation_errors = exception.getError();

    const interaction: CommandInteraction = host.getArgs()[0];

    const message: InteractionReplyOptions = {
      content: `Invalid input received:\n${validation_errors
        .map((err) =>
          err.constraints != null
            ? Object.values(err.constraints)
                .map((m) => `- ${m}.`)
                .join('\n')
            : `- Check ${err.property}.`,
        )
        .join('\n')}`,
    };

    if (interaction.replied) {
      const original = await interaction.fetchReply();
      message.content = `${original.content}\n\nEdit: ${message.content}`;
      await interaction.editReply(message);
    } else if (interaction.deferred) {
      await interaction
        .followUp(message)
        .catch((err) => this.logger.error(err));
    } else {
      await interaction.reply(message).catch((err) => this.logger.error(err));
    }
  }
}
