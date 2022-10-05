import {
  BigIntType,
  Entity,
  PrimaryKey,
  Property,
  TimeType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';
@Entity()
export class Virgin {
  //[x: string]: any;

  @PrimaryKey({ type: String })
  uuid = v4();
  @Property({ type: BigIntType })
  discordId: string;
  @Property({ type: BigIntType })
  //Virginity Points
  virginity: number;
  @Property({ type: BigIntType })
  //Virginity Points
  guild: string;
  @Property({ type: 'timestamptz' })
  //Time Since last login neccessary to calculate virgnity
  blueballs: Date;
  @Property()
  //Virginity Points
  username: string;

  constructor(
    discordId: string,
    virginity: number,
    blueballs: Date,
    guild: string,
    username: string,
  ) {
    this.discordId = discordId;
    this.virginity = virginity;
    this.blueballs = blueballs;
    this.guild = guild;
    this.username = username;
  }
}
