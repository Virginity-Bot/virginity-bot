import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Events, GuildMember } from 'discord.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { userLogHeader } from 'src/utils/logs';
import { TimingLogInterceptor } from '../interceptors/logging.interceptor';

@Injectable()
@UseInterceptors(TimingLogInterceptor)
export class UpdateUsers {
  private readonly logger = new Logger(UpdateUsers.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
  ) {}

  @On(Events.GuildMemberUpdate)
  @UseRequestContext()
  async update(
    old_member: GuildMember,
    new_member: GuildMember,
  ): Promise<void> {
    this.logger.debug(`${userLogHeader(old_member)} was updated.`);

    await this.virgins.nativeUpdate(
      { id: new_member.id, guild: new_member.guild.id },
      {
        username: new_member.user.username,
        discriminator: new_member.user.discriminator,
        nickname: new_member.nickname,
      },
    );
  }
}
