import {
  DoubleType,
  Embeddable,
  Embedded,
  Property,
  TextType,
} from '@mikro-orm/core';

@Embeddable()
export class GuildScoreMultiplierSettings {
  /**
   * The score multiplier applied when sharing your screen in VC.
   * This stacks with other multipliers if `score_multipliers_stack` is enabled.
   */
  @Property({
    type: DoubleType,
    default: 1.5,
    comment:
      'The score multiplier applied when sharing your screen in VC. This stacks with other multipliers if `score_multipliers_stack` is enabled.',
  })
  screen = 1.5;

  /**
   * The score multiplier applied when sharing your camera in VC.
   * This stacks with other multipliers if `score_multipliers_stack` is enabled.
   */
  @Property({
    type: DoubleType,
    default: 1.5,
    comment:
      'The score multiplier applied when sharing your camera in VC. This stacks with other multipliers if `score_multipliers_stack` is enabled.',
  })
  camera = 1.5;

  /**
   * The score multiplier applied when gaming while in VC.
   * This stacks with other multipliers if `score_multipliers_stack` is enabled.
   */
  @Property({
    type: DoubleType,
    default: 1.5,
    comment:
      'The score multiplier applied when gaming while in VC. This stacks with other multipliers if `score_multipliers_stack` is enabled.',
  })
  gaming = 1.5;
}

@Embeddable()
export class GuildScoreSettings {
  @Embedded()
  multiplier = new GuildScoreMultiplierSettings();

  /**
   * Whether or not score multipliers should stack, or use the highest value.
   */
  @Property({
    default: true,
    comment:
      'Whether or not score multipliers should stack, or use the highest value.',
  })
  multipliers_stack = true;

  /** Wether or not the guild has score resets enabled. */
  @Property({
    default: true,
    comment: 'Wether or not the guild has score resets enabled.',
  })
  reset_enabled = true;

  /**
   * When to reset a guild's scores. Uses CRON-style denotation.
   * If null, scores will never reset.
   */
  @Property({
    type: TextType,
    default: '0 18 * * Tue',
    comment: `When to reset a guild's scores. Uses CRON-style denotation. If null, scores will never reset.`,
  })
  reset_schedule = '0 18 * * Tue';
}
