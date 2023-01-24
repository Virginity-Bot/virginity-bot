import {
  Entity,
  PrimaryKey,
  Property,
  TextType,
  UuidType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class DeletedRecord {
  @PrimaryKey({ type: UuidType, defaultRaw: 'uuid_generate_v4()' })
  id: string = v4();

  @Property({ defaultRaw: 'NOW()' })
  deletedAt: Date = new Date();

  @Property({ defaultRaw: 'NOW()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: TextType })
  table_name: string;

  @Property({ type: TextType })
  object_id: string;

  @Property({ type: 'jsonb' })
  data: Record<string, unknown>;
}
