import {
  Collection,
  Entity,
  OneToMany,
  Property,
  TextType,
} from '@mikro-orm/core';

import { BaseEntity } from './base.entity';
import { Virgin } from './virgin.entity';

@Entity()
export class Guild extends BaseEntity {
  @Property({ type: TextType })
  snowflake: string;

  @Property({ type: TextType })
  name: string;

  @Property({ type: TextType })
  biggest_virgin_role_id?: string;

  @OneToMany(() => Virgin, (g) => g.guild)
  virgins = new Collection<Virgin>(this);
}
