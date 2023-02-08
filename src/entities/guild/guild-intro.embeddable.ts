import { Embeddable, IntegerType, Property } from '@mikro-orm/core';

@Embeddable()
export class GuildIntroSettings {
  /** The maximum duration in seconds that a custom intro song can play. */
  @Property({
    type: IntegerType,
    default: 30,
    comment:
      'The maximum duration in seconds that a custom intro song can play.',
  })
  max_duration_s = 30;

  /** Whether or not custom intro songs should be enabled. */
  @Property({
    default: true,
    comment: 'Whether or not custom intro songs should be enabled.',
  })
  custom_enabled = true;
}
