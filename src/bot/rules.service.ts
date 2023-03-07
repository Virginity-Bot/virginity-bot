import { EmbedBuilder } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { stripIndent } from 'common-tags';
import * as cronstrue from 'cronstrue';

import { GuildEntity } from 'src/entities/guild/guild.entity';

@Injectable()
export class RulesService {
  constructor(private readonly orm: MikroORM) {}

  @UseRequestContext()
  async buildRulesboardEmbed(guild: GuildEntity): Promise<EmbedBuilder> {
    let cron_human = `${cronstrue.toString(guild.score.reset_schedule, {
      locale: `en`,
      use24HourTimeFormat: true,
    })} UTC`;
    cron_human = cron_human[0].toLocaleLowerCase() + cron_human.slice(1);

    // Board Embed for Rules
    const board_embed = new EmbedBuilder()
      .setColor(guild.role.color)
      .setThumbnail(
        'https://github.com/Virginity-Bot/virginity-bot/blob/master/assets/logo.png?raw=true',
      )
      .setTitle(`Virginity Bot rules of ${guild.name}`)
      .setURL('https://github.com/Virginity-Bot/virginity-bot')
      .setDescription(
        "A Discord Bot to track peoples' virginity, i.e. their accumulated online time in VC.",
      )
      .setFields(
        {
          name: 'How to Increase Your Virginity:',
          value: stripIndent`
            • Join a public voice chat.
            • Virgins must not be muted or deafened.
            • Play games, stream, or share your camera for more points :)\n`,
        },
        {
          name: 'Additional Features',
          value: stripIndent`
            • Biggest virgin gets an intro song when entering chat.
            • Upload a custom intro song with the \`/settings\` command.
            • Guilds settings can be changed with \`/guild-settings\` command.\n`,
        },
        {
          name: 'Point Distribution',
          value: stripIndent`
            • 1 point earned per minute in VC.
            • Streaming - ${guild.score.multiplier.screen}x
            • Camera - ${guild.score.multiplier.camera}x
            • Gaming - ${guild.score.multiplier.gaming}x
            • Multipliers ${
              guild.score.multipliers_stack ? '' : 'do not '
            }stack.
            • Scores ${guild.score.reset_enabled ? '' : 'do not '}reset${
            guild.score.reset_enabled ? ` ${cron_human}` : ''
          }.
            • Multiplier defaults can be changed by server admin.`,
        },
      );

    return board_embed;
  }
}
