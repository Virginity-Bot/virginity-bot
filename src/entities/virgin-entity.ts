import { BigIntType, Entity, PrimaryKey, Property, UuidType } from "@mikro-orm/core";
import { randomInt, randomUUID } from "crypto";
import { Collection } from "discord.js";
import { type } from "os";
import {v4 } from 'uuid';
@Entity()
export class Virgin {
  [x: string]: any;

  @PrimaryKey({type: String})
  uuid = v4();
  @Property({ type: BigIntType })
  _id: string;
  @Property({ type: BigIntType })
  //Virginity Points
  virginity: number;
  @Property({ type: BigIntType })
  //Virginity Points
  guild: string;
  @Property({ type: BigIntType })
  //Time Since last login neccessary to calculate virgnity
  blueballs: number;
  @Property()
  //Virginity Points
  username: string;

  constructor(_id: string, virginity: number, blueballs: number, guild: string, username: string) {
    this._id = _id;
    this.virginity = virginity;
    this.blueballs = blueballs;
    this.guild = guild;
    this.username = username;
  }

}