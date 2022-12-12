import { roleMention, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMemberEditData, Role, RoleManager } from 'discord.js';
import { MikroORM } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';
import { userInfo } from 'os';
import { updateSpread } from 'typescript';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crown')
    .setDescription('Assigns user the chonkiest virgin role')
    .addStringOption((option) => option.setName('userdata').setDescription('Enter a users name').setRequired(true)),
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
      const roles = await interaction.guild?.roles.fetch();
      if (roles?.find((element) => element.name == 'Chonkiest Virgin the World Has Ever Seen')) {
        let mem = await interaction.guild?.members.cache.find(
          (member) => member.roles.cache.has('Chonkiest Virgin the World Has Ever Seen') === true,
        );
        mem?.roles.remove('Chonkiest Virgin the World Has Ever Seen');
        let members = await interaction.guild?.members.cache;
        mem = await members?.find((element) => element.id == virgin.discordId);
        let role = roles?.find((element) => element.name == 'Chonkiest Virgin the World Has Ever Seen');
        await mem?.roles.add(role!);
      } else {
        let role = await interaction.guild?.roles
          .create({
            name: 'Chonkiest Virgin the World Has Ever Seen',
            color: 'BLUE',
            reason: 'we needed a chonky boi',
          })
          //.then(console.log)
          .catch(console.error);
        //await interaction.guild?.roles.resolveId
        let members = await interaction.guild?.members.cache;
        let mem = members?.find((element) => element.id == virgin.discordId);
        await mem?.roles.add(role!);
      }
      await interaction.reply('The Virgin has been crowned');
    } catch (e) {
      await interaction.reply('Virgin not found, good night I guess?');
    }
  },
};
