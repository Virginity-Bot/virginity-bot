import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { MikroORM } from '@mikro-orm/core';
import { PermissionFlagsBits } from 'discord-api-types/v9';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cleardb')
    .setDescription('Clears the DB of everything')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction: CommandInteraction) {
    try {
      const orm = await MikroORM.init();
      const generator = orm.getSchemaGenerator();
      await generator.refreshDatabase(); // ensure db exists and is fresh
      await generator.clearDatabase(); // removes all data

      await orm.close(true);
    } catch (e) {
      await interaction.reply('Unable to clear the Database');
    }
  },
};
