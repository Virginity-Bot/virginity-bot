import { PrimaryKey, Property, UuidType } from '@mikro-orm/core';
import { v4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryKey({ type: UuidType })
  id: string = v4();

  @Property({ defaultRaw: 'NOW()' })
  createdAt: Date = new Date();

  @Property({ defaultRaw: 'NOW()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
