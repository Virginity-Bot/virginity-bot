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

    return `INTERVAL '${value_ms} ms'`;
  }

  convertToDatabaseValueSQL(key: string, platform: Platform): string {
    return `INTERVAL '${key} ms'`;
  }

  /**
   * @param value The DB value as a string.
   */
  convertToJSValue(value: string | number, platform: Platform): number {
    if (typeof value !== 'string') {
      throw ValidationError.invalidType(IntervalType, value, 'DB');
    }

    /**
     * PostgresQL supports multiple output styles for its intervals. You can
     * check which one you're using by checking the value of `intervalstyle` in
     * your DB.
     *
     * The 4 possible styles are `sql_standard`, `postgres`, `postgres_verbose`,
     * and `iso_8601`, with `postgres` being the default.
     *
     * We need to handle all 4.
     */

    const { years, months, days, hours, minutes, seconds, milliseconds } =
      this._parseDBIntervalStyle(value);

    return new Date(
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
    ).getTime();
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

  _parseDBIntervalStyle(value: string): {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  } {
    let matches: RegExpMatchArray | null;

    if (
      // checks for `postgres`:
      // 6 years 5 mons 4 days 03:02:01
      /^\d /.test(value)
    ) {
      matches = value.match(regex_interval_style_postgres);
    } else if (
      // checks for `sql_standard`:
      // +6-5 +4 +3:02:01
      value.startsWith('+')
    ) {
      matches = value.match(regex_interval_style_sql_standard);
    } else if (
      // checks for `iso_8601`:
      // P6Y5M4DT3H2M1S
      value.startsWith('P')
    ) {
      matches = value.match(regex_interval_style_iso_8601);
    } else if (
      // checks for `postgres_verbose`:
      // @ 6 years 5 mons 4 days 3 hours 2 mins 1 sec
      value.startsWith('@ ')
    ) {
      matches = value.match(regex_interval_style_postgres_verbose);
    } else {
      throw ValidationError.invalidType(IntervalType, value, 'DB');
    }

    return {
      years:
        matches?.groups?.years != null ? parseFloat(matches?.groups?.years) : 0,
      months:
        matches?.groups?.months != null
          ? parseFloat(matches?.groups?.months)
          : 0,
      days:
        matches?.groups?.days != null ? parseFloat(matches?.groups?.days) : 0,
      hours:
        matches?.groups?.hours != null ? parseFloat(matches?.groups?.hours) : 0,
      minutes:
        matches?.groups?.minutes != null
          ? parseFloat(matches?.groups?.minutes)
          : 0,
      seconds:
        matches?.groups?.seconds != null
          ? parseFloat(matches?.groups?.seconds)
          : 0,
      milliseconds:
        matches?.groups?.ms != null ? parseFloat(matches?.groups?.ms) : 0,
    };
  }
}
