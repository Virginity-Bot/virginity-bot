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
import { IntroSongEntity } from './intro-song.entity';

@Entity({ tableName: 'virgin' })
export class VirginEntity extends BaseEntity {
  /** Discord's snowflake identifier */
  @PrimaryKey({ type: TextType, index: true })
  id: string;

  @ManyToOne({ name: 'guild_snowflake', primary: true })
  guild: GuildEntity;

  [PrimaryKeyType]?: [string, string];

  /** User's Discord username */
  @Property({ type: TextType, index: true, comment: `User's Discord username` })
  username: string;

  /** User's Discord discriminator */
  @Property({
    type: TextType,
    index: true,
    comment: `User's Discord discriminator`,
  })
  discriminator: string;

  // TODO(4): MikroORM's internal type checker thinks this is non-nullable if we don't specify `nullable`
  /** User's Discord guild-specific nickname */
  @Property({
    type: TextType,
    nullable: true,
    comment: `User's Discord guild-specific nickname`,
  })
  nickname?: string;

  /**
   * The cached total duration the user has spent in VC.
   * Keep in mind this can be out of date!
   */
  @Property({
    index: true,
    comment: [
      'The cached total duration the user has spent in VC.',
      'Keep in mind this can be out of date!',
    ].join(' '),
  })
  cached_dur_in_vc: number = 0;

  @OneToMany(() => VCEventEntity, (e) => e.virgin, {
    orderBy: { connection_start: QueryOrder.DESC },
  })
  vc_events = new Collection<VCEventEntity>(this);

  // TODO(4): MikroORM's internal type checker thinks this is non-nullable if we don't specify `nullable`
  @ManyToOne({ nullable: true })
  intro_song?: IntroSongEntity;

  // TODO(4): MikroORM's internal type checker thinks this is non-nullable if we don't specify `nullable`
  @Property({ type: TextType, nullable: true })
  title_when_leader?: string;
}
