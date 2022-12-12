import { MikroORM } from '@mikro-orm/core';
import { MessageEmbed } from 'discord.js';
import { brotliCompressSync } from 'zlib';
import { Virgin } from './entities/virgin-entity';

export default async function getBoard(guildId: string) {
  const boardEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Leader Board')
    .setAuthor({
      name: 'Virginity Bot',
      iconURL: 'https://i.imgur.com/X9AWcYV.jpg',
      url: 'https://github.com/EdgarSaldivar/VirginityBot',
    })
    .setThumbnail('https://i.imgur.com/X9AWcYV.jpg')
    .setTimestamp();

  const orm = (await MikroORM.init()).em.fork();
  var virginArray: Virgin[] = new Array();
  let biggestVirgin: string = ' ';
  try {
    const virgin = await orm.find(Virgin, { guild: { $eq: guildId } });
    for (let i = 0; i < virgin.length; i++) {
      virginArray.push(
        new Virgin(virgin[i].discordId, virgin[i].virginity, virgin[i].blueballs, virgin[i].guild, virgin[i].username),
      );
    }
    virginArray.sort((a, b) => (a.virginity > b.virginity ? -1 : 1));
    biggestVirgin = virginArray[0].username.toString();
    for (let i = 0; i < virginArray.length; i++) {
      boardEmbed.addFields({
        name: i + 1 + ') ' + virginArray[i].username,
        value: virginArray[i].virginity.toString(),
      });
    }

    //return { MessageEmbed[]: [boardEmbed], biggestVirgin };
  } catch (e) {
    //return { embeds: [boardEmbed], string: biggestVirgin };
  }
}
