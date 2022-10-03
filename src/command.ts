import {
  BaseCommandInteraction,
  ChatInputApplicationCommandData,
  Client,
} from 'discord.js';

export interface Command extends ChatInputApplicationCommandData {
  //data: any;
  run: (client: Client, interaction: BaseCommandInteraction) => void;
}
