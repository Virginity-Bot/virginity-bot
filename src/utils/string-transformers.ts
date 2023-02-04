import { GuildMember } from 'discord.js';
import { VirginEntity } from 'src/entities/virgin.entity';

export function virgin_display_name(
  user: Pick<VirginEntity, 'username' | 'nickname'> | GuildMember,
): string {
  if (user instanceof GuildMember) {
    const member = user;
    return member.nickname ?? member.user.username;
  } else if ('username' in user) {
    const virgin = user as Pick<VirginEntity, 'username' | 'nickname'>;
    return virgin.nickname ?? virgin.username;
  } else {
    throw new TypeError(`Invalid parameters`);
  }
}

export function possess(str: string, count: number = 2): string {
  return `${str}'${str.at(-1) === 's' ? '' : 's'}`;
}
