import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  Property,
  TextType,
} from '@mikro-orm/core';

import { Guild } from './guild.entity';
import { BaseEntity } from './base.entity';
import { VCEvent } from './vc-event.entity';

@Entity()
export class Virgin extends BaseEntity {
  @Property({ type: TextType })
  snowflake: string;

  @Property({ type: TextType })
  username: string;

  @Property({ type: TextType })
  discriminator: string;

  @ManyToOne()
  guild: Guild;

  @Property()
  cached_dur_in_vc: number = 0;

  @OneToMany(() => VCEvent, (e) => e.virgin)
  vc_events = new Collection<VCEvent>(this);
}
