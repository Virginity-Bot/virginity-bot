import { Injectable } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import { Client, Events, Guild } from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MikroORM, NotFoundError, UseRequestContext } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { GuildEntity } from 'src/entities/guild.entity';

@Injectable()
export class UpdatedGuilds {
  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guildRepo: EntityRepository<GuildEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @On(Events.ClientReady)
  @UseRequestContext()
  async ready(client: Client): Promise<void> {
    // TODO(5): consider deleting guilds that aren't active anymore
    // TODO(4): paginate this
    for (const [_, guild] of await client.guilds.fetch()) {
      this.guildRepo.upsert({
        id: guild.id,
        name: guild.name,
        updatedAt: new Date(),
      });
    }

    return await this.guildRepo.flush();
  }

  @On(Events.GuildCreate)
  @UseRequestContext()
  async guildJoined(guild: Guild): Promise<void> {
    this.guildRepo.create({
      id: guild.id,
      name: guild.name,
    });

    return await this.guildRepo.flush();
  }

  @On(Events.GuildUpdate)
  @UseRequestContext()
  async guildUpdated(old_guild: Guild, new_guild: Guild): Promise<void> {
    this.guildRepo.upsert({
      id: old_guild.id,
      name: new_guild.name,
      updatedAt: new Date(),
    });

    return await this.guildRepo.flush();
  }

  @On(Events.GuildDelete)
  @UseRequestContext()
  async guildRemoved(guild: Guild): Promise<void> {
    // TODO(5): what should we do when a guild removes us?
  }
}
