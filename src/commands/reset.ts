import { SlashCommandBuilder } from '@discordjs/builders';
import {
  BaseCommandInteraction,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  InteractionReplyOptions,
  MessagePayload,
  Permissions,
  Snowflake,
} from 'discord.js';
import { MikroORM, wrap } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';
//import { InteractionResponseType as CommandInteraction } from 'discord-api-types/v9';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription("Resets user's virginity")
    .addStringOption((option) =>
      option
        .setName('user')
        .setDescription('Enter a users name')
        .setRequired(true),
    ),
  //async execute(interaction: BaseCommandInteraction) {
  async execute(interaction: {
    options: CommandInteractionOptionResolver;
    guildId: Snowflake;
    member: GuildMember;
    guild: Guild;
    reply: any;
  }) {
    const orm = await MikroORM.init();
    const time = new Date();
    const userId = interaction.options.getString('user')?.toLowerCase();
    const guildId = interaction.guildId!;
    if (!interaction.member.roles.cache.some((role) => role.name === 'Admin')) {
      await interaction.reply(
        'You Have No Power Here Gandalf the Grey ( ͡° ͜ʖ ͡°)',
      );
      //console.log(interaction.member.guild);
    } else {
      try {
        const virgin = await orm.em.findOneOrFail(Virgin, {
          $and: [
            { guild: { $eq: guildId } },
            {
              username: {
                $eq: userId,
              },
            },
          ],
        });
        const virgin1 = new Virgin(
          virgin.discordId,
          0,
          time,
          virgin.guild,
          virgin.username,
        );
        wrap(virgin).assign(virgin1, { mergeObjects: true });
        await orm.em.persistAndFlush(virgin);
        await interaction.reply('Reset ' + userId + "'s virginity");
      } catch (e) {
        await interaction.reply('Virgin not found, good night I guess?');
      }
    }
  },
};
