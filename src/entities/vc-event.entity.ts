import {
  Cascade,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  UuidType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';

import { VirginEntity } from './virgin.entity';
import { BaseEntity } from './base.entity';
import { GuildEntity } from './guild';

@Entity({ tableName: 'vc_event' })
export class VCEventEntity extends BaseEntity {
  @PrimaryKey({ type: UuidType, defaultRaw: 'uuid_generate_v4()' })
  id: string = v4();

  @ManyToOne({
    fieldNames: ['virgin_snowflake', 'guild_snowflake'],
    cascade: [Cascade.ALL],
  })
  virgin: VirginEntity;

  @ManyToOne({ fieldName: 'guild_snowflake', hidden: true, nullable: true })
  guild: GuildEntity;

  /** The time the user entered VC */
  @Property({
    defaultRaw: 'NOW()',
    index: true,
    comment: 'The time the user entered VC',
  })
  connection_start: Date;

  /** The time the user left VC */
  @Property({ index: true, comment: 'The time the user left VC' })
  connection_end?: Date;

  /** Whether or not the user is sharing their screen */
  @Property({ comment: 'Whether or not the user is sharing their screen' })
  screen: boolean = false;

  /** Whether or not the user is sharing their camera */
  @Property({ comment: 'Whether or not the user is sharing their camera' })
  camera: boolean = false;

  /** Whether or not the user has a game open */
  @Property({ comment: 'Whether or not the user has a game open' })
  gaming: boolean = false;
}
