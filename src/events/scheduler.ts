import getBoard from '../board';
import { Client, Collection, Guild, GuildBasedChannel, MessageEmbed, TextChannel } from 'discord.js';
var cron = require('node-cron');

//This event schedules an announcement to take place every tuesday for
// the chonkiest virgin in the virginity-bot channel
module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    try {
      cron.schedule('* * 10 * * Tuesday', () => {
        const guilds = client.guilds.cache;
        let temp = new Collection<string, GuildBasedChannel>();
        const test = guilds.forEach(async (guild) => {
          var leaderboard: MessageEmbed;
          var biggestVirgin: string = ' ';
          //{[leaderboard, biggestVirgin]} = await getBoard(guild.id.toString());
          temp = guild.channels.cache.filter((TextChannel) => TextChannel.name === 'virginity-bot');
          temp.forEach((channel) => {
            if (channel.type === 'GUILD_TEXT') {
              channel.send({ embeds: [leaderboard] });
              channel.send("Congrats to this week's Chonkiest Virgin: " + biggestVirgin);
            }
          });
        });
      });
    } catch (e) {
      console.log(e);
      console.log('Scheduled Event Failed');
    }
  },
};
