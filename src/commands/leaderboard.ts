import { SlashCommandBuilder } from '@discordjs/builders';
import { BaseCommandInteraction, MessageEmbed } from 'discord.js';
import { MikroORM, wrap } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Replies with the leader board.'),
  async execute(
    interaction: BaseCommandInteraction,
    newState: { channelId: any; member: { id: any }; guild: { id: any } },
  ) {
    const boardEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Leader Board')
      .setAuthor({
        name: 'Virginity Bot',
        iconURL: 'https://i.imgur.com/X9AWcYV.jpg',
        url: 'https://github.com/EdgarSaldivar/VirginityBot',
      })
      .setThumbnail('https://i.imgur.com/X9AWcYV.jpg')
      .setTimestamp();

    const orm = (await MikroORM.init()).em.fork();
    const guildId = interaction.guildId;
    var virginArray: Virgin[] = new Array();
    try {
      const virgin = await orm.find(Virgin, { guild: { $eq: guildId } });
      for (let i = 0; i < virgin.length; i++) {
        virginArray.push(
          new Virgin(
            virgin[i].discordId,
            virgin[i].virginity,
            virgin[i].blueballs,
            virgin[i].guild,
            virgin[i].username,
          ),
        );
      }
      virginArray.sort((a, b) => (a.virginity > b.virginity ? -1 : 1));
      for (let i = 0; i < virginArray.length; i++) {
        boardEmbed.addFields({
          name: i + 1 + ') ' + virginArray[i].username,
          value: virginArray[i].virginity.toString(),
        });
      }
      await interaction.reply({ embeds: [boardEmbed] });
    } catch (e) {
      await interaction.reply('No Virgins :(');
    }
  },
};
