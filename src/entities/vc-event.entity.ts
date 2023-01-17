import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { Guild } from './guild.entity';
import { Virgin } from './virgin.entity';
import { BaseEntity } from './base.entity';

@Entity()
export class VCEvent extends BaseEntity {
  @ManyToOne(() => Guild)
  guild: Guild;

  @ManyToOne(() => Virgin)
  virgin: Virgin;

  @Property()
  connection_start: Date;

  @Property()
  connection_end?: Date;

  @Property()
  streaming: boolean = false;

  @Property()
  camera: boolean = false;
}
