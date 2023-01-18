import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  Property,
  QueryOrder,
  TextType,
} from '@mikro-orm/core';

import { Guild } from './guild.entity';
import { BaseEntity } from './base.entity';
import { VCEvent } from './vc-event.entity';

@Entity()
export class Virgin extends BaseEntity {
  //discordId
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

  @OneToMany(() => VCEvent, (e) => e.virgin, {
    orderBy: { connection_start: QueryOrder.DESC },
  })
  vc_events = new Collection<VCEvent>(this);
}
