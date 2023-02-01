import { Embeddable, Property, TextType } from '@mikro-orm/core';

@Embeddable()
export class GuildChannelSettings {
  /** The name of the virginity bot text channel in Discord. */
  @Property({
    type: TextType,
    default: 'virginity-bot',
    comment: 'The name of the virginity bot text channel in Discord.',
  })
  name = 'virginity-bot';

  /** The description of the virginity bot text channel in Discord. */
  @Property({
    type: TextType,
    default:
      'Compete with other virgins to claim the honor of being the biggest virgin.',
    comment: 'The description of the virginity bot text channel in Discord.',
  })
  description =
    'Compete with other virgins to claim the honor of being the biggest virgin.';
}
