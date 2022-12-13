import { roleMention, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { MikroORM } from '@mikro-orm/core';
import { PermissionFlagsBits } from 'discord-api-types/v9';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearroles')
    .setDescription('Un-assigns the role from every possible user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction: CommandInteraction) {
    const orm = (await MikroORM.init()).em.fork();
    const guildId = interaction.guildId;
    const isAdmin = interaction.member?.permissions;
    try {
      const roles = await interaction.guild?.roles.fetch();
      var mem;
      while (
        (mem = await interaction.guild?.members.cache.find(
          (member) => member.roles.cache.has('Chonkiest Virgin the World Has Ever Seen') === true,
        ))
      ) {
        await mem?.roles.remove('Chonkiest Virgin the World Has Ever Seen');
      }
      await interaction.reply('The Virgin have been laid');
    } catch (e) {
      await interaction.reply('No Roles to Clear');
    }
  },
};
