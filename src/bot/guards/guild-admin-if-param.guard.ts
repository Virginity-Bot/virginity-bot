import { InjectDiscordClient } from '@discord-nestjs/core';
import {
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Client, CommandInteraction } from 'discord.js';

import { GuildAdminGuard } from './guild-admin.guard';

const metadata_name = 'param_names';

export function GuildAdminIfParam(...param_names: string[]) {
  return SetMetadata(metadata_name, param_names);
}

@Injectable()
export class GuildAdminIfParamGuard extends GuildAdminGuard {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @InjectDiscordClient() client: Client,
  ) {
    super(client);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const interaction: CommandInteraction = ctx.getArgs()[0];

    const param_names = this.reflector.get<string[]>(
      metadata_name,
      ctx.getHandler(),
    );

    const params_include_protected =
      param_names.find((name) =>
        interaction.options.data.find((opt) => opt.name === name),
      ) != null;

    if (params_include_protected) {
      return super.canActivate(ctx);
    } else {
      return true;
    }
  }
}
