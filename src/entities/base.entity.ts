import { Property } from '@mikro-orm/core';

export abstract class BaseEntity {
  @Property({ defaultRaw: 'NOW()', index: true })
  createdAt: Date = new Date();

  @Property({ defaultRaw: 'NOW()', index: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
