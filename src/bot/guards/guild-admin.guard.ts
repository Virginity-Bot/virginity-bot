import { InjectDiscordClient } from '@discord-nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Client, CommandInteraction, PermissionFlagsBits } from 'discord.js';

@Injectable()
export class GuildAdminGuard implements CanActivate {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const interaction: CommandInteraction = ctx.getArgs()[0];

    return (
      interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ??
      false
    );
  }
}
