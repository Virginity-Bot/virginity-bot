import { InjectDiscordClient } from '@discord-nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Client, CommandInteraction, PermissionFlagsBits } from 'discord.js';

@Injectable()
export class GuildAdminGuard implements CanActivate {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const interaction: CommandInteraction = ctx.getArgs()[0];

    if (interaction.guild == null) {
      return false;
    } else if (interaction.member == null) {
      return false;
    }

    const guild = await this.client.guilds.fetch(interaction.guild.id);
    const member = await guild.members.fetch(interaction.member.user.id);

    return member.permissions.has(PermissionFlagsBits.Administrator);
  }
}
