import { InjectDiscordClient } from '@discord-nestjs/core';
import { EmbedBuilder, Client, APIEmbedField, Guild, User } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { GuildEntity } from 'src/entities/guild.entity';
import configuration from 'src/config/configuration';
import { DatabaseService } from 'src/database/database.service';
import { DiscordHelperService } from './discord-helper.service';
import { virgin_display_name } from 'src/utils/string-transformers';

type APIEmbedFieldArray = APIEmbedField & { value: (string | number)[] };

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly database: DatabaseService,
    private readonly discord_helper: DiscordHelperService,
  ) {}

  @UseRequestContext()
  async buildLeaderboardEmbed(
    guild: GuildEntity | Guild,
    requester?: VirginEntity | User,
  ): Promise<EmbedBuilder> {
    const board_embed = new EmbedBuilder()
      .setColor(configuration.role.color)
      .setTitle(`Biggest Virgins of ${guild.name}`);

    const top_virgins = await this.virginsRepo.find(
      { guild: guild.id },
      { orderBy: [{ cached_dur_in_vc: -1 }], limit: 10 },
    );
    if (top_virgins.length === 0) {
      board_embed.setDescription('No virgins 😭');
      return board_embed;
    }

    await this.discord_helper.assignBiggestVirginRole(top_virgins[0]);
    await this.guilds.flush();

    const fields = top_virgins.reduce(
      (fields, virgin, i) => {
        fields[0].value.push(this.virginToLeaderboardLine(virgin, i + 1));
        return fields;
      },
      <[APIEmbedFieldArray]>[
        { name: ' ', value: [] as string[], inline: true },
      ],
    );

    if (requester != null) {
      if (top_virgins.find((v) => v.id === requester.id) == null) {
        // The requesting user didn't show up in the leaderboard

        const requester_ent = await this.virginsRepo.findOne([
          requester.id,
          guild.id,
        ]);

        fields[0].value.push('...');

        if (requester_ent == null) {
          fields[0].value.push(
            this.virginToLeaderboardLine(
              {
                username: requester.username,
                cached_dur_in_vc: 0,
              },
              '?',
            ),
          );
        } else {
          const qb = this.virginsRepo.qb();
          const requester_place = await qb
            .raw<Promise<{ rows: { array_position: number } }>>(
              `SELECT ARRAY_POSITION(ARRAY(SELECT id FROM virgin WHERE guild_snowflake = ? ORDER BY cached_dur_in_vc DESC), ?)`,
              [requester_ent.guild.id, requester_ent.id],
            )
            .then((res) => res.rows[0].array_position);

          fields[0].value.push(
            this.virginToLeaderboardLine(requester_ent, requester_place),
          );
        }
      }
    }

    board_embed.addFields(
      fields.map((field) => ({ ...field, value: field.value.join('\n') })),
    );
    // TODO(2): add some flavor text in an additional nameless embed
    return board_embed;
  }

  virginToLeaderboardLine(
    virgin: Pick<VirginEntity, 'username' | 'nickname' | 'cached_dur_in_vc'>,
    pos: number | string,
  ): string {
    return `**${pos}.** ${pos === 1 ? '**' : ''}${virgin_display_name(virgin)}${
      pos === 1 ? `** ${configuration.role.emoji}` : ''
    } — ${virgin.cached_dur_in_vc}`;
  }
}
