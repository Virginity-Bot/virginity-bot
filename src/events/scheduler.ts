import { channel } from 'diagnostics_channel';
import { Client, Collection, Guild, GuildBasedChannel, TextChannel } from 'discord.js';
var cron = require('node-cron');

//This event schedules an announcement to take place every tuesday for
// the chonkiest virgin in the virginity-bot channel
module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    try {
      let scheduledMessage = new cron.CronJob('* * 10 * * Tuesday', () => {
        const guilds = client.guilds.cache;
        let temp = new Collection<string, GuildBasedChannel>();
        const test = guilds.forEach((guild) => {
          temp = guild.channels.cache.filter((TextChannel) => TextChannel.name === 'virginity-bot');
          temp.forEach((channel) => {
            if (channel.type === 'GUILD_TEXT') {
              channel.send('d');
            }
          });
        });
      });
    } catch (e) {
      console.log('Scheduled Event Failed');
    }
  },
};
