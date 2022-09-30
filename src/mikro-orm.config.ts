import { Options } from "@mikro-orm/core";
import { Test } from "./entities/test-entity";
import {Virgin} from "./entities/virgin-entity"

const options: Options = {
    entities: [Virgin],
    type: 'postgresql',
    dbName: 'postgres',
    //debug: true,
    port: 3306,
    user: 'edgar',
    password: 'password',
}

export default options;