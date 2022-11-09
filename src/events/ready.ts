//
import { channel } from 'diagnostics_channel';
import { Client, Collection, GuildBasedChannel, TextChannel } from 'discord.js';

module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    if (client.user != null) {
      console.log(`Ready! Logged in as ${client.user.tag}`);
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
    }
  },
};
