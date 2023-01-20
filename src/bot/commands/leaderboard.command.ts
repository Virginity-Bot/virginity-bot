import {
  Command,
  CommandExecutionContext,
  DiscordCommand,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  MessagePayload,
  StringSelectMenuInteraction,
  EmbedBuilder,
  Client,
  Role,
  GuildMember,
  ColorResolvable,
  APIEmbedField,
} from 'discord.js';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import { VirginEntity } from 'src/entities/virgin.entity';
import { GuildEntity } from 'src/entities/guild.entity';
import configuration from 'src/config/configuration';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DiscordHelperService } from '../discord-helper.service';
import { DatabaseService } from 'src/database/database.service';

@Command({
  name: 'leaderboard',
  description: 'Replies with the leader board.',
})
@Injectable()
export class LeaderboardCommand implements DiscordCommand {
  constructor(
    private readonly orm: MikroORM,
    @InjectRepository(GuildEntity)
    private readonly guilds: EntityRepository<GuildEntity>,
    @InjectRepository(VirginEntity)
    private readonly virginsRepo: EntityRepository<VirginEntity>,
    @InjectRepository(VCEventEntity)
    private readonly vc_events: EntityRepository<VCEventEntity>,
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly database: DatabaseService,
    private readonly discord_helper: DiscordHelperService,
  ) {}

  @UseRequestContext()
  async handler(
    interaction: ChatInputCommandInteraction<CacheType>,
    ctx: CommandExecutionContext<
      ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>
    >,
  ): Promise<MessagePayload> {
    const boardEmbed = new EmbedBuilder()
      .setColor(configuration.role.color)
      .setTitle(`Biggest Virgins of ${interaction.guild.name}`);

    await this.recalculateScores(interaction.guildId);

    const top_virgins = await this.virginsRepo.find(
      { guild: interaction.guildId },
      { orderBy: [{ cached_dur_in_vc: -1 }], limit: 10 },
    );
    if (top_virgins.length === 0) {
      boardEmbed.setDescription('No virgins 😭');
      return new MessagePayload(interaction.channel, { embeds: [boardEmbed] });
    }

    await this.discord_helper.assignBiggestVirginRole(top_virgins[0]);
    await this.guilds.flush();

    const fields = top_virgins.reduce(
      (fields, virgin, i) => {
        fields[0].value.push(this.virginToLeaderboardLine(virgin, i + 1));
        return fields;
      },
      <[APIEmbedFieldArray]>[{ name: ' ', value: [], inline: true }],
    );

    if (top_virgins.find((v) => v.id === interaction.user.id) == null) {
      // The requesting user didn't show up in the leaderboard

      const requester = await this.virginsRepo.findOneOrFail([
        interaction.user.id,
        interaction.guildId,
      ]);

      const qb = this.virginsRepo.qb();
      const requester_place = await qb
        .raw<Promise<{ rows: { array_position: number } }>>(
          `SELECT ARRAY_POSITION(ARRAY(SELECT id FROM virgin WHERE guild_snowflake = ? ORDER BY cached_dur_in_vc DESC), ?)`,
          [requester.guild.id, requester.id],
        )
        .then((res) => res.rows[0].array_position);

      fields[0].value.push('...');
      // TODO: is requester_place 0-indexed?
      fields[0].value.push(
        this.virginToLeaderboardLine(requester, requester_place),
      );
    }

    boardEmbed.addFields(
      fields.map((field) => ({ ...field, value: field.value.join('\n') })),
    );
    return new MessagePayload(interaction.channel, { embeds: [boardEmbed] });
  }

  virginToLeaderboardLine(virgin: VirginEntity, pos: number | string): string {
    return `**${pos}.** ${pos === 1 ? '**' : ''}${
      virgin.nickname ?? virgin.username
    }${pos === 1 ? '** 👑' : ''} — ${virgin.cached_dur_in_vc}`;
  }

  async recalculateScores(guild_id: string) {
    const timestamp = new Date();
    const users_in_vc = await this.discord_helper.getUsersInVC(guild_id);

    // close all in-progress events
    const events = await Promise.all(
      users_in_vc.map(async (user) => {
        const old_event = await this.database.closeEvent(
          user.guild,
          user,
          timestamp,
        );
        if (old_event != null) {
          return this.vc_events.create({
            ...old_event,
            id: null,
            virgin: [old_event.virgin.id, old_event.virgin.guild.id],
            connection_start: timestamp,
            connection_end: null,
          });
        }
      }),
    );

    await this.vc_events.persistAndFlush(events);
  }
}

type APIEmbedFieldArray = APIEmbedField & { value: (string | number)[] };
