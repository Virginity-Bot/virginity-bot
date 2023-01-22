import { Property } from '@mikro-orm/core';

export abstract class BaseEntity {
  @Property({ defaultRaw: 'NOW()', index: true })
  created_at: Date = new Date();

  @Property({ defaultRaw: 'NOW()', index: true, onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
