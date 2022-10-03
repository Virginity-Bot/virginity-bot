import { SlashCommandBuilder } from '@discordjs/builders';
import { BaseCommandInteraction } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction: BaseCommandInteraction) {
    await interaction.reply('Pong!');
  },
};
