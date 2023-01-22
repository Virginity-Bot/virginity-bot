import {
  Collection,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  TextType,
  UuidType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BaseEntity } from './base.entity';
import { VirginEntity } from './virgin.entity';

@Entity({ tableName: 'virgin_settings' })
export class VirginSettingsEntity extends BaseEntity {
  @PrimaryKey({ type: UuidType, defaultRaw: 'uuid_generate_v4()' })
  id: string = v4();

  @ManyToOne(() => VirginEntity, {
    name: 'virgin_snowflake',
    referenceColumnName: 'id',
  })
  virgin_guilds = new Collection<VirginEntity>(this);

  // TODO(0): what level of control should users get?
  @Property({ type: TextType })
  intro_song: string;

  @Property({ type: TextType })
  title_when_leader: string;
}
