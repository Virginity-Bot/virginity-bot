import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  PrimaryKeyType,
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

  @ManyToOne({ name: 'guild_snowflake', primary: true })
  guild: GuildEntity;

  [PrimaryKeyType]?: [string, string];

  @Property({ type: TextType, index: true })
  username: string;

  @Property({ type: TextType, index: true })
  discriminator: string;

  // TODO(4): MikroORM's internal type checker thinks this is non-nullable if we don't specify `nullable`
  @Property({ type: TextType, nullable: true })
  nickname?: string;

  @Property({ index: true })
  cached_dur_in_vc: number = 0;

  @OneToMany(() => VCEventEntity, (e) => e.virgin, {
    orderBy: { connection_start: QueryOrder.DESC },
  })
  vc_events = new Collection<VCEventEntity>(this);
}
