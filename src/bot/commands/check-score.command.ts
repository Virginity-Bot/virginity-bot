import { Injectable, Logger } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  Payload,
  Param,
  TransformedCommandExecutionContext,
  ParamType,
  DiscordTransformedCommand,
  UsePipes,
} from '@discord-nestjs/core';
import { MessagePayload } from 'discord.js';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { pluralize, virgin_display_name } from 'src/utils/string-transformers';
import { DiscordHelperService } from '../discord-helper.service';

export class ScoreDTO {
  @Param({
    name: 'virgin',
    description: 'The user to check',
    required: false,
    type: ParamType.USER,
  })
  virgin_to_check?: string;
}

@Command({
  name: 'check',
  description: `Checks how big of a virgin someone is.`,
})
@UsePipes(TransformPipe)
@Injectable()
export class CheckScoreCommand implements DiscordTransformedCommand<ScoreDTO> {
  private readonly logger = new Logger(CheckScoreCommand.name);

  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(VirginEntity)
    private readonly virgins: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vc_events: EntityRepository<VCEventEntity>,
    private readonly database: DatabaseService,
    private readonly discord_helper: DiscordHelperService,
  ) {}

  @UseRequestContext()
  async handler(
    @Payload() dto: ScoreDTO,
    { interaction }: TransformedCommandExecutionContext,
  ): Promise<MessagePayload> {
    if (interaction.member == null) {
      this.logger.error([`interaction.member was null somehow`, interaction]);
      throw new Error(`interaction.member was null somehow`);
    } else if (interaction.channel == null) {
      this.logger.error([`interaction.channel was null somehow`, interaction]);
      throw new Error(`interaction.channel was null somehow`);
    } else if (interaction.guild == null) {
      this.logger.error([`interaction.guild was null somehow`, interaction]);
      throw new Error(`interaction.guild was null somehow`);
    }

    const timestamp = new Date(interaction.createdTimestamp);

    const in_prog_event = await this.database.closeEvent(
      interaction.guild,
      interaction.member,
      timestamp,
    );

    if (in_prog_event != null) {
      await this.database.openEvent(in_prog_event, null, timestamp);
      await this.vc_events.flush();
    }

    const virgin = await this.virgins.findOne([
      dto.virgin_to_check ?? interaction.member.user.id,
      interaction.guild.id,
    ]);

    // Role Changes when scores are updated.
    this.discord_helper.assignBiggestVirginRoleGuild(
      interaction.guild.id.toString(),
    );

    // TODO(2): add flavor text
    return new MessagePayload(interaction.channel, {
      content: `${
        dto.virgin_to_check != null
          ? `${pluralize(
              virgin_display_name(
                virgin ??
                  (await this.discord_helper.fetchGuildMember(
                    interaction.guild.id,
                    dto.virgin_to_check ?? interaction.member.user.id,
                  )) ?? { username: 'Unknown user', nickname: undefined },
              ),
            )}`
          : 'Your'
      } score is: ${virgin?.cached_dur_in_vc ?? 0}.`,
    });
  }
}
