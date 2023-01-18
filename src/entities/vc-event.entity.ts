import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { Guild } from './guild.entity';
import { Virgin } from './virgin.entity';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'vc_event' })
export class VCEvent extends BaseEntity {
  @ManyToOne()
  guild: Guild;

  @ManyToOne()
  virgin: Virgin;

  @Property({ defaultRaw: 'NOW()' })
  connection_start: Date;

  @Property()
  connection_end?: Date;

  @Property()
  screen: boolean = false;

  @Property()
  camera: boolean = false;
}