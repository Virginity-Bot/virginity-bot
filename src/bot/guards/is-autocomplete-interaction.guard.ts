import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';

@Injectable()
export class IsAutocompleteInteractionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const interaction: CommandInteraction = context.getArgs()[0];
    return interaction.isAutocomplete();
  }
}
