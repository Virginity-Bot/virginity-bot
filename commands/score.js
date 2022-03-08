const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('score')
		.setDescription('replies with score'),
		async execute(interaction) {
		let target = interaction.options.getUser('user') || interaction.user;
		let user = Users.findOne({ where: { user_id: target.id } });
			await interaction.reply(`Score: ${user.virginity}`);
		},
};