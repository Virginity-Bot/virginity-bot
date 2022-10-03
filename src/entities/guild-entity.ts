import { BigIntType, Collection, Entity, PrimaryKey, Property } from "@mikro-orm/core";
//import { Collection } from "discord.js";
import {Virgin} from "./virgin-entity";

@Entity()
export class Guild {
  [x: string]: any;
 //var time = new Date().getTime() - new Date("2013-02-20T12:01:04.753Z").getTime();
  @PrimaryKey({ type: BigIntType })
  id: string;
  @Property({ type: BigIntType })
  virgins= new Collection<Virgin>(this);

  constructor(id: string, virgin: Virgin) {
    this.id = id;
    this.virgins.add(virgin);
  }

}