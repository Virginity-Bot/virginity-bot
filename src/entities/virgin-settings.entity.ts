import {
  Collection,
  Entity,
  ManyToOne,
  Property,
  TextType,
} from '@mikro-orm/core';

import { BaseEntity } from './base.entity';
import { IntroSongEntity } from './intro-song.entity';
import { VirginEntity } from './virgin.entity';

@Entity({ tableName: 'virgin_settings' })
export class VirginSettingsEntity extends BaseEntity {
  @ManyToOne(() => VirginEntity, {
    name: 'virgin_snowflake',
    referenceColumnName: 'id',
  })
  virgin_guilds = new Collection<VirginEntity>(this);

  // TODO(4): MikroORM's internal type checker thinks this is non-nullable if we don't specify `nullable`
  @ManyToOne({ nullable: true })
  intro_song?: IntroSongEntity;

  // TODO(4): MikroORM's internal type checker thinks this is non-nullable if we don't specify `nullable`
  @Property({ type: TextType, nullable: true })
  title_when_leader?: string;
}
