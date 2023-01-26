import { VirginEntity } from 'src/entities/virgin.entity';

export function virgin_display_name(
  virgin: Pick<VirginEntity, 'username' | 'nickname'>,
): string {
  return virgin.nickname ?? virgin.username;
}
