import { Injectable, UseInterceptors } from '@nestjs/common';
import { InjectDiscordClient, On } from '@discord-nestjs/core';
import { Client, Events, Guild, OAuth2Guild } from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MikroORM, NotFoundError, UseRequestContext } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { SchedulingService } from 'src/scheduling/scheduling.service';
import { GuildEntity } from 'src/entities/guild/guild.entity';
import { DiscordHelperService } from '../discord-helper.service';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@Injectable()
@UseInterceptors(new LoggingInterceptor(UpdatedGuilds.name))
export class UpdatedGuilds {
  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    private readonly discord_helper: DiscordHelperService,
    private readonly scheduling: SchedulingService,
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @On(Events.ClientReady)
  @UseRequestContext()
  async ready(client: Client): Promise<void> {
    // TODO(5): consider deleting guilds that aren't active anymore
    // TODO(4): paginate this
    const guilds = await client.guilds.fetch();
    await Promise.all(
      guilds.map(async (guild) => {
        const guild_ent = await this.guilds
          .findOneOrFail(guild.id)
          .then((guild_ent) => {
            return guild_ent;
          })
          .catch((err) => {
            if (err instanceof NotFoundError) {
              return this.guildJoined(guild);
            } else {
              throw err;
            }
          });

        await this.discord_helper.findOrCreateBiggestVirginRole(guild_ent);
        await this.discord_helper.findOrCreateVirginityBotChannel(guild_ent);
      }),
    );

    return this.guilds.flush();
  }

  @On(Events.GuildCreate)
  @UseRequestContext()
  async guildJoined(guild: Guild | OAuth2Guild): Promise<GuildEntity> {
    const guild_ent = await this.guilds
      .findOneOrFail({
        id: guild.id,
        name: guild.name,
      })
      .catch(async (err) => {
        if (err instanceof NotFoundError) {
          const guild_ent = this.guilds.create({
            id: guild.id,
            name: guild.name,
          } as GuildEntity);
          await this.guilds.flush();
          return guild_ent;
        } else {
          throw err;
        }
      });

    await this.discord_helper.findOrCreateBiggestVirginRole(guild_ent);
    await this.discord_helper.findOrCreateVirginityBotChannel(guild_ent);

    await this.guilds.flush();

    await this.scheduling.scheduleResets();

    return guild_ent;
  }

  @On(Events.GuildUpdate)
  @UseRequestContext()
  async guildUpdated(old_guild: Guild, new_guild: Guild): Promise<void> {
    this.guilds.upsert({
      id: old_guild.id,
      name: new_guild.name,
      updated_at: new Date(),
    });

    return this.guilds.flush();
  }

  @On(Events.GuildDelete)
  @UseRequestContext()
  async guildRemoved(guild: Guild): Promise<void> {
    // TODO(5): what should we do when a guild removes us?
  }
}
