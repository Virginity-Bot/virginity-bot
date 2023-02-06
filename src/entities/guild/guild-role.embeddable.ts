import { Embeddable, Property, TextType } from '@mikro-orm/core';
import { HexColorString } from 'discord.js';

@Embeddable()
export class GuildRoleSettings {
  /** The name of the chonkiest virgin's role in Discord. */
  @Property({
    type: TextType,
    default: 'Chonkiest Virgin the World Has Ever Seen',
    comment: `The name of the chonkiest virgin's role in Discord.`,
  })
  name = 'Chonkiest Virgin the World Has Ever Seen';

  /** The color of the chonkiest virgin's role in Discord. */
  @Property({
    type: TextType,
    default: '#DA8C80',
    comment: `The color of the chonkiest virgin's role in Discord.`,
  })
  color: HexColorString = '#DA8C80';

  /** An emoji to adorn the chonkiest virgin's role in Discord. */
  @Property({
    type: TextType,
    default: '👑',
    comment: `An emoji to adorn the chonkiest virgin's role in Discord.`,
  })
  emoji = '👑';
}
