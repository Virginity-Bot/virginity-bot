//
import { Client } from 'discord.js';

module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    if (client.user != null) {
      console.log(`Ready! Logged in as ${client.user.tag}`);
    }
  },
};
