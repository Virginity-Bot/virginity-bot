import { SlashCommandBuilder } from '@discordjs/builders';
import { BaseCommandInteraction } from 'discord.js';
import { MikroORM, wrap } from "@mikro-orm/core";
import { Virgin } from "../entities/virgin-entity";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('score')
		.setDescription('Replies with users score'),
	async execute(interaction: BaseCommandInteraction, newState: { channelId: any; member: { id: any; };}) {
        const orm = await MikroORM.init()
        try {
            const virgin = await orm.em.findOneOrFail(Virgin, { _id: interaction.member?.user.id });
            //const virgin1 = new Virgin(newState.member.id, virgin.virginity, time)
            console.log("Found");
            console.log("Virginity: " +virgin.virginity);
            await interaction.reply("Your Virginity is: " +virgin.virginity);
          } catch (e) {
            await interaction.reply("Your Virginity is: 0" );
          }
	},
};
