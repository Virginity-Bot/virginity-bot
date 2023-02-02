import {
  EntityProperty,
  Platform,
  Type,
  ValidationError,
} from '@mikro-orm/core';
import { TransformContext } from '@mikro-orm/core/types/Type';

const regex_interval_style_postgres =
  /^(?:(?<years>\d+) years ?)?(?:(?<months>\d+) mons ?)?(?:(?<days>\d+) days ?)?(?:(?<hours>\d{1,2}):(?=.+:))?(?:(?<minutes>\d{1,2}):)?(?:(?<seconds>\d{1,2}))?(?:\.(?<ms>\d+))?$/;
const regex_interval_style_postgres_verbose = /i/;
const regex_interval_style_sql_standard = /i/;
const regex_interval_style_iso_8601 = /i/;

/** Converts to/from JS numeric milliseconds to DB interval */
export class IntervalType extends Type<number, string> {
  /**
   * @param value_ms The JS value in numeric milliseconds.
   */
  convertToDatabaseValue(
    value_ms: string | number,
    platform: Platform,
    context?: boolean | TransformContext | undefined,
  ): string {
    if (typeof value_ms !== 'number') {
      throw ValidationError.invalidType(IntervalType, value_ms, 'JS');
    }

    return `'${value_ms} ms'`;
  }

  convertToDatabaseValueSQL(key: string, platform: Platform): string {
    return `INTERVAL ${key}`;
  }

  /**
   * @param value_ms The DB value as a string.
   */
  convertToJSValue(value_ms: string | number, platform: Platform): number {
    if (typeof value_ms !== 'string') {
      throw ValidationError.invalidType(IntervalType, value_ms, 'DB');
    }

    return parseInt(value_ms);
  }

  convertToJSValueSQL(key: string, platform: Platform): string {
    return `EXTRACT(MILLISECOND FROM ${key})`;
  }

  toJSON(value: number, platform: Platform): string | number {
    return `${value} ms`;
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return 'interval';
  }

  compareAsType(): string {
    return 'number';
  }
}
