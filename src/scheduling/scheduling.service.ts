import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { Client, Guild, GuildMember, VoiceState } from 'discord.js';
import configuration from 'src/config/configuration';
import { userLogHeader } from 'src/utils/logs';
import { GuildEntity } from 'src/entities/guild.entity';
import { InjectDiscordClient } from '@discord-nestjs/core';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vcEvents: EntityRepository<VCEventEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @Cron(configuration.score.reset_schedule)
  @UseRequestContext()
  async findEventToClose(): Promise<VCEventEntity> {
    return;
  }
}
