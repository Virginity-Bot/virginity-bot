import { registerDecorator, ValidationOptions } from 'class-validator';

const cron_exp_regex =
  /^(?:(?<sec>\S+) )?(?<min>\S+) (?<hr>\S+) (?<day_month>\S+) (?<month>\S+) (?<day_week>\S+)$/;
const slow_cron_regex =
  /^(?:(?<sec>\d+) )?(?<min>\d+) (?<hr>\d+) (?<day_month>[1-9*]\d*(?:[-/]?\d*|(?:,\d+)+)) (?<month>[1-9*]\d*(?:[-/]?\d*|(?:,\d+)+)) (?<day_week>(?:[0-6*](?:[-/]?[0-6]|(?:,[0-6])*)|\S+))$/;

export function IsInfrequentCron(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsInfrequentCron',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, args) {
          if (typeof value !== 'string') return false;

          return slow_cron_regex.test(value);
        },
        defaultMessage(args) {
          if (typeof args?.value !== 'string')
            return `\`$property\` has invalid type ${typeof args?.value}`;

          if (!cron_exp_regex.test(args.value))
            return '`$property` must be a [CRON expression](https://crontab.guru/)';
          else if (!slow_cron_regex.test(args.value))
            return '`$property` is too frequent';
          else return 'Unknown error';
        },
      },
    });
  };
}
