import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

export default async function deleteCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  // ...

  // for global commands
  rest
    .put(Routes.applicationCommands(process.env.CLIENT), { body: [] })
    .then(() => console.log('Successfully deleted all application commands.'))
    .catch(console.error);
}
