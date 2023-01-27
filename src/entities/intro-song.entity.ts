import {
  Collection,
  Entity,
  Index,
  OneToMany,
  PrimaryKey,
  Property,
  TextType,
  UuidType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BaseEntity } from './base.entity';
import { VirginSettingsEntity } from './virgin-settings.entity';

@Entity({ tableName: 'intro_song' })
export class IntroSongEntity extends BaseEntity {
  /** The hash of uploaded audio file. Uses SHA-256. */
  @PrimaryKey({
    type: TextType,
    comment: 'The hash of uploaded audio file. Uses SHA-256.',
  })
  hash: string;

  @OneToMany(() => VirginSettingsEntity, (e) => e.intro_song)
  virgin_settings = new Collection<VirginSettingsEntity>(this);

  /** The name of the intro song. */
  @Property({ type: TextType, comment: 'The name of the intro song.' })
  name: string;

  /**
   * Reference to an audio file.
   *
   * Supports the following schemas:
   *
   * - s3://
   * - vbot-builtin://
   */
  @Property({
    type: TextType,
    comment: `Reference to an audio file. Supports s3:// and vbot-builtin:// schemas.`,
  })
  uri: string;
}
