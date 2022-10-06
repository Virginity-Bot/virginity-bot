import { SlashCommandBuilder } from '@discordjs/builders';
import { BaseCommandInteraction } from 'discord.js';
import { MikroORM, wrap } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('score')
    .setDescription('Replies with users score'),
  async execute(
    interaction: BaseCommandInteraction,
    newState: { channelId: any; member: { id: any }; guild: { id: any } },
  ) {
    const orm = await MikroORM.init();
    const guildId = interaction.guildId;
    try {
      const virgin = await orm.em.findOneOrFail(Virgin, {
        $and: [
          { guild: { $eq: guildId } },
          {
            discordId: {
              $eq: interaction.member?.user.id,
            },
          },
        ],
      });
      await interaction.reply('Your Virginity is: ' + virgin.virginity);
    } catch (e) {
      console.log(interaction.member?.user.id);
      console.log(guildId);
      await interaction.reply('Your Virginity is: 0');
    }
  },
};
