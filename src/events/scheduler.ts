import getBoard from '../board';
import { Client, Collection, Guild, GuildBasedChannel, MessageEmbed, TextChannel } from 'discord.js';
var cron = require('node-cron');
import schemaUpdate from '../schemaUpdate';
import { MikroORM } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';

//This event schedules an announcement to take place every tuesday for
// the chonkiest virgin in the virginity-bot channel
module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    try {
      cron.schedule('* * 10 * * Tuesday', () => {
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
        const guilds = client.guilds.cache;
        let temp = new Collection<string, GuildBasedChannel>();
        const test = guilds.forEach(async (guild) => {
          var leaderboard: MessageEmbed;
          var biggestVirgin: string = ' ';
          //{[leaderboard, biggestVirgin]} = await getBoard(guild.id.toString());
          temp = guild.channels.cache.filter((TextChannel) => TextChannel.name === 'virginity-bot');
          temp.forEach(async (channel) => {
            const orm = (await MikroORM.init()).em.fork();
            const guildId = channel.guildId;
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
              biggestVirgin = virginArray[0].username;
              for (let i = 0; i < virginArray.length; i++) {
                boardEmbed.addFields({
                  name: i + 1 + ') ' + virginArray[i].username,
                  value: virginArray[i].virginity.toString(),
                });
              }
              if (channel.type === 'GUILD_TEXT') {
                channel.send({ embeds: [boardEmbed] });
                channel.send("Congrats to this week's Chonkiest Virgin: " + biggestVirgin);
              }
            } catch (e) {
              console.log(e);
            }
          });
          await schemaUpdate();
        });
      });
    } catch (e) {
      console.log(e);
      console.log('Scheduled Event Failed');
    }
  },
};
