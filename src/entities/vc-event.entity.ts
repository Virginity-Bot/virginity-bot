import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  UuidType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';

import { GuildEntity } from './guild.entity';
import { VirginEntity } from './virgin.entity';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'vc_event' })
export class VCEventEntity extends BaseEntity {
  @PrimaryKey({ type: UuidType, defaultRaw: 'uuid_generate_v4()' })
  id: string = v4();

  @ManyToOne({ name: 'guild_snowflake' })
  guild: GuildEntity;

  @ManyToOne({ name: 'virgin_snowflake' })
  virgin: VirginEntity;

  @Property({ defaultRaw: 'NOW()', index: true })
  connection_start: Date;

  @Property({ index: true })
  connection_end?: Date;

  @Property()
  screen: boolean = false;

  @Property()
  camera: boolean = false;
}
