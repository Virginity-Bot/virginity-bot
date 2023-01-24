import { Guild, GuildMember, User, VoiceState } from 'discord.js';
import { VirginEntity } from 'src/entities/virgin.entity';

export function userLogHeader(state: VoiceState): string;
export function userLogHeader(member: GuildMember): string;
export function userLogHeader(virgin: VirginEntity, guild: Guild): string;
export function userLogHeader(...args): string {
  let user!: Pick<User | VirginEntity, 'username' | 'discriminator'>;
  let guild!: Guild;

  switch (args.length) {
    case 1: {
      if (args[0] instanceof VoiceState) {
        const state = args[0];
        user = state.member?.user ?? {
          username: 'Unknown user',
          discriminator: '',
        };
        guild = state.guild;
      } else if (args[0] instanceof GuildMember) {
        const member = args[0];
        user = member.user;
        guild = member.guild;
      }
      break;
    }
    case 2: {
      const [virgin, _guild] = args as unknown as [VirginEntity, Guild];
      user = virgin;
      guild = _guild;
      break;
    }
  }

  return `${user.username}#${user.discriminator} of "${guild.name}"`;
}
