import { SlashCommandBuilder } from '@discordjs/builders';
import { BaseCommandInteraction } from 'discord.js';
import { MikroORM, wrap } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Replies with the leaderboard'),
  async execute(
    interaction: BaseCommandInteraction,
    newState: { channelId: any; member: { id: any }; guild: { id: any } },
  ) {
    const orm = (await MikroORM.init()).em.fork();
    console.log('test');
    console.log(interaction.member?.user.username);
    //const guildId = newState.guild.id;
    const guildId = interaction.guildId;
    try {
      const virgin = await orm.find(Virgin, { guild: { $eq: guildId } });
      let response = 'Leaderboard:' + '\n';
      for (let i = 0; i < virgin.length; i++) {
        response =
          response + virgin[i].username + ': ' + virgin[i].virginity.toString();
        console.log(i + ' ' + virgin[i]);
      }
      console.log(response);

      await interaction.reply(response);
    } catch (e) {
      await interaction.reply('Your Virginity is: 0');
    }
  },
};
