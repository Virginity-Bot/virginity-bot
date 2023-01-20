import { Guild, GuildMember, User, VoiceState } from 'discord.js';
import { VirginEntity } from 'src/entities/virgin.entity';

export function userLogHeader(state: VoiceState): string;
export function userLogHeader(member: GuildMember): string;
export function userLogHeader(virgin: VirginEntity, guild: Guild): string;
export function userLogHeader(): string {
  let user: User | VirginEntity;
  let guild: Guild;

  switch (arguments.length) {
    case 1:
      if (arguments[0] instanceof VoiceState) {
        const state = arguments[0];
        user = state.member.user;
        guild = state.guild;
      } else if (arguments[0] instanceof GuildMember) {
        const member = arguments[0];
        user = member.user;
        guild = member.guild;
      }
      break;
    case 2:
      const [virgin, _guild] = arguments as any as [VirginEntity, Guild];
      user = virgin;
      guild = _guild;
      break;
  }

  return `${user.username}#${user.discriminator} of "${guild.name}"`;
}
