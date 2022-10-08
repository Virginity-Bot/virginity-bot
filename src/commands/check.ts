import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { MikroORM } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkvirginity')
    .setDescription('Replies with users score, case sensitive')
    .addStringOption((option) =>
      option
        .setName('userdata')
        .setDescription('Enter a users name')
        .setRequired(true),
    ),
  async execute(interaction: CommandInteraction) {
    const orm = (await MikroORM.init()).em.fork();
    const userId = interaction.options.getString('userdata')?.toLowerCase();
    const guildId = interaction.guildId;
    try {
      const virgin = await orm.findOneOrFail(Virgin, {
        $and: [
          { guild: { $eq: guildId } },
          {
            username: {
              $eq: userId,
            },
          },
        ],
      });
      await interaction.reply(userId + "'s virginity: " + virgin.virginity);
    } catch (e) {
      await interaction.reply('Virgin not found, good night I guess?');
    }
  },
};
