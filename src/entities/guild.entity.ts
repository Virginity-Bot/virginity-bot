import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  TextType,
} from '@mikro-orm/core';

import { BaseEntity } from './base.entity';
import { VCEventEntity } from './vc-event.entity';
import { VirginEntity } from './virgin.entity';

@Entity({ tableName: 'guild' })
export class GuildEntity extends BaseEntity {
  /** Discord's snowflake identifier */
  @PrimaryKey({ type: TextType, unique: true, index: true })
  id: string;

  @Property({ type: TextType })
  name: string;

  @Property({ type: TextType })
  biggest_virgin_role_id?: string;

  @OneToMany(() => VirginEntity, (v) => v.guild)
  virgins = new Collection<VirginEntity>(this);
}
