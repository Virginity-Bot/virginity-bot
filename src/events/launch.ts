import { Client, Guild } from 'discord.js';

//This event listens for a new Guild (Discord Server)
//when the bot joins it will create a channel if it doesn't already have one.
module.exports = {
  name: 'guildCreate',
  once: true,
  async execute(guild: Guild) {
    //const guild = await client.guilds.fetch('<GUILD_ID>');
    let channels = await guild.channels.fetch();
    if (channels.has('virginity-bot')) {
      console.log('Already contains channel');
    } else {
      await guild.channels.create('virginity-bot', {
        type: 'GUILD_TEXT',
      });
    }
  },
};
