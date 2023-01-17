import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { Guild } from './guild.entity';
import { BaseEntity } from './base.entity';

@Entity()
export class Virgin extends BaseEntity {
  @Property()
  username: string;

  @Property()
  discriminator: string;

  @ManyToOne(() => Guild)
  guild: Guild;

  @Property()
  cached_dur_in_vc: number = 0;
}
