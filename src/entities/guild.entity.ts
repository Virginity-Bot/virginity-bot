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
  /** Discord guild's snowflake identifier */
  @PrimaryKey({
    type: TextType,
    unique: true,
    index: true,
    comment: `Discord guild's snowflake identifier`,
  })
  id: string;

  /** Name of the Discord guild */
  @Property({ type: TextType, comment: 'Name of the Discord guild' })
  name: string;

  /** ID of the biggest virgin role */
  @Property({ type: TextType, comment: 'ID of the biggest virgin role' })
  biggest_virgin_role_id?: string;

  @OneToMany(() => VirginEntity, (v) => v.guild)
  virgins = new Collection<VirginEntity>(this);
}
