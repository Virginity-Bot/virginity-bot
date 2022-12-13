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
      let roles = await interaction.guild?.roles.fetch();
      let role = roles?.find((element) => element.name == 'Chonkiest Virgin the World Has Ever Seen');
      role!.members.forEach((member, i) => {
        // Looping through the members of Role.
        setTimeout(() => {
          member.roles.remove(role!); // Removing the Role.
        }, 1000);
      });
      await interaction.reply('The Virgins have been laid');
    } catch (e) {
      await interaction.reply('No Roles to Clear');
    }
  },
};
