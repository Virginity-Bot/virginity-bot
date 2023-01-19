import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  QueryOrder,
  TextType,
} from '@mikro-orm/core';

import { GuildEntity } from './guild.entity';
import { BaseEntity } from './base.entity';
import { VCEventEntity } from './vc-event.entity';

@Entity({ tableName: 'virgin' })
export class VirginEntity extends BaseEntity {
  /** Discord's snowflake identifier */
  @PrimaryKey({ type: TextType, index: true })
  id: string;

  @Property({ type: TextType, index: true })
  username: string;

  @Property({ type: TextType, index: true })
  discriminator: string;

  @ManyToOne({ name: 'guild_snowflake' })
  guild: GuildEntity;

  @Property({ index: true })
  cached_dur_in_vc: number = 0;

  @OneToMany(() => VCEventEntity, (e) => e.virgin, {
    orderBy: { connection_start: QueryOrder.DESC },
  })
  vc_events = new Collection<VCEventEntity>(this);
}
