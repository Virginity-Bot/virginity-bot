import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Test {
    
    @PrimaryKey()
    _id!: number;

    @Property()
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}