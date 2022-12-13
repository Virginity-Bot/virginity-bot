import { Client, Collection, Intents } from 'discord.js';
import * as fs from 'node:fs';
import schemaUpdate from './schemaUpdate';
import path from 'path';
import deployCommands from './deploy-commands';
import * as dotenv from 'dotenv';

const main = async () => {
  await schemaUpdate();
  await deployCommands();

  //This how you tell discord what sort of events to send you
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_VOICE_STATES, //Needed for Voice Activity
    ],
  });

  client.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  const eventFiles = fs.readdirSync('./build/events').filter((file: string) => file.endsWith('.js'));
  //Reads all events from directory
  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    console.log(`Event loaded: ${event.name}`);
    if (event.once) {
      client.once(event.name, (...args: any) => event.execute(...args));
    } else {
      client.on(event.name, (...args: any) => event.execute(...args));
    }
  }
  //Reads in Commands
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    console.log(command.data.name);
    client.commands.set(command.data.name, command);
  }

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  });
  dotenv.config();
  client.login(process.env.TOKEN);
};

main();
