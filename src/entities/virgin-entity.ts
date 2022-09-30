import { BigIntType, Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { randomInt, randomUUID } from "crypto";

@Entity()
export class Virgin {
  [x: string]: any;

    //var time = new Date().getTime() - new Date("2013-02-20T12:01:04.753Z").getTime();
  @PrimaryKey({ type: BigIntType })
  _id: string;

  @Property({ type: BigIntType })
  //Virginity Points
  virginity: number;
  @Property({ type: BigIntType })
  //Time Since last login neccessary to calculate virgnity
  blueballs: number;

  constructor(_id: string, virginity: number, blueballs: number) {
    this._id = _id;
    this.virginity = virginity;
    this.blueballs = blueballs;
    //this._key = randomInt(10);
  }

}