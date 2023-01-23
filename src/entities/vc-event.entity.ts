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

// TODO(2): formalize individual virgin_snowflake and guild_snowflake relation to relevant tables
@Entity({ tableName: 'vc_event' })
export class VCEventEntity extends BaseEntity {
  @PrimaryKey({ type: UuidType, defaultRaw: 'uuid_generate_v4()' })
  id: string = v4();

  @ManyToOne({ fieldNames: ['virgin_snowflake', 'guild_snowflake'] })
  virgin: VirginEntity;

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
