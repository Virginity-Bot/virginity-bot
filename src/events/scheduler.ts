import getBoard from '../board';
import { Client, Collection, Guild, GuildBasedChannel, MessageEmbed, TextChannel } from 'discord.js';
var cron = require('node-cron');
import schemaUpdate from '../schemaUpdate';
import { MikroORM } from '@mikro-orm/core';
import { Virgin } from '../entities/virgin-entity';
/*
This event schedules an announcement to take place every tuesday @10am PST (1800 UTC)
for the chonkiest virgin in the virginity-bot channel for all servers the bot services
*/
module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    try {
      cron.schedule('0 18 * * Tue', () => {
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
        console.log(guilds);
        guilds.forEach(async (guild) => {
          let biggestVirgin: string = ' ';
          const virginityBotChannels = guild.channels.cache.filter(
            (TextChannel) => TextChannel.name === 'virginity-bot',
          );
          virginityBotChannels.forEach(async (channel) => {
            const orm = (await MikroORM.init()).em.fork();
            const guildId = channel.guildId;
            try {
              const virgins = await orm.find(Virgin, { guild: { $eq: guildId } });
              const virginArray = virgins.map((virgin) => {
                return new Virgin(virgin.discordId, virgin.virginity, virgin.blueballs, virgin.guild, virgin.username);
              });
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
      console.error(e);
      console.error('Scheduled Event Failed');
    }
  },
};
