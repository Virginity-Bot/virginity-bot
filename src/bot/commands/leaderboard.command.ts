import {
  Command,
  CommandExecutionContext,
  DiscordCommand,
  Param,
} from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  MessagePayload,
  StringSelectMenuInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Guild } from 'src/entities/guild.entity';
import { Virgin } from 'src/entities/virgin.entity';

@Command({
  name: 'leaderboard',
  description: 'Replies with the leader board.',
})
@Injectable()
export class LeaderboardCommand implements DiscordCommand {
  constructor(private readonly virginsRepo: EntityRepository<Virgin>) {}
  async handler(
    interaction: ChatInputCommandInteraction<CacheType>,
    ctx: CommandExecutionContext<
      ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>
    >,
  ): Promise<MessagePayload> {
    this.virginsRepo;
    const boardEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Leader Board')
      .setAuthor({
        name: 'Virginity Bot',
        iconURL: 'https://i.imgur.com/X9AWcYV.jpg',
        url: 'https://github.com/EdgarSaldivar/VirginityBot',
      })
      .setThumbnail('https://i.imgur.com/X9AWcYV.jpg')
      .setTimestamp();

    const guildId = interaction.guildId;
    try {
      const virgins = await this.virginsRepo.find({ guild: { $eq: guildId } });
      virgins.sort((a, b) => b.cached_dur_in_vc - a.cached_dur_in_vc);
      for (let i = 0; i < virgins.length; i++) {
        boardEmbed.addFields({
          name: i + 1 + ') ' + virgins[i].username,
          value: virgins[i].cached_dur_in_vc.toString(),
        });
      }
      const roles = await interaction.guild?.roles.fetch();
      if (
        roles?.find(
          (element) =>
            element.name == 'Chonkiest Virgin the World Has Ever Seen',
        )
      ) {
        let mem = await interaction.guild?.members.cache.find(
          (member) =>
            member.roles.cache.has(
              'Chonkiest Virgin the World Has Ever Seen',
            ) === true,
        );
        mem?.roles.remove('Chonkiest Virgin the World Has Ever Seen');
        let members = await interaction.guild.members.cache;
        mem = await members?.find(
          (element) => element.id == virgins[0].snowflake,
        );
        let role = roles?.find(
          (element) =>
            element.name == 'Chonkiest Virgin the World Has Ever Seen',
        );
        await mem?.roles.add(role!);
      } else {
        let role = await interaction.guild.roles.create({
          name: 'Chonkiest Virgin the World Has Ever Seen',
          color: 'Blue',
          reason: 'we needed a chonky boi',
        });
        //await interaction.guild?.roles.resolveId
        let members = await interaction.guild?.members.cache;
        let mem = members?.find(
          (element) => element.id == virgins[0].snowflake,
        );
        await mem?.roles.add(role!);
      }
      await interaction.reply({ embeds: [boardEmbed] });
    } catch (e) {
      console.log(e);
      await interaction.reply('No Virgins :(');
    }

    return new MessagePayload(interaction.channel, {
      content: 'Hello, World!',
    });
  }
}
