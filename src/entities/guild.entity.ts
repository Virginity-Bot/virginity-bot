import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';

import { BaseEntity } from './base.entity';
import { Virgin } from './virgin.entity';

@Entity()
export class Guild extends BaseEntity {
  @Property()
  name: string;

  // TODO: do we need this?
  @Property()
  afk_channel_id?: string;

  @Property()
  biggest_virgin_role_id?: string;

  @OneToMany(() => Virgin, (g) => g.guild)
  virgins = new Collection<Virgin>(this);
}
