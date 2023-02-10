import { hostname } from 'node:os';

import { WinstonModule } from 'nest-winston';
import { format } from 'winston';
import type TransportStream from 'winston-transport';
import { Console } from 'winston/lib/winston/transports';
import LokiTransport from 'winston-loki';
import { format as dateFormat } from 'date-fns';
import { green, yellow, red, magentaBright, cyanBright, gray } from 'chalk';

import configuration, { LogLevel } from 'src/config/configuration';

const MAX_LEVEL_LENGTH = Math.max(
  ...['info', 'error', 'warn', 'debug', 'verbose'].map((l) => l.length),
);

export class ContextAwareLokiTransport extends LokiTransport {
  override log(
    info: unknown & { labels?: Record<string, string>; context?: string },
    callback: () => void,
  ) {
    super.log?.(
      {
        ...info,
        labels: {
          ...(info.labels ?? {}),
          context: info.context,
        },
      },
      callback,
    );
  }
}

export const logger = WinstonModule.createLogger({
  level: ((level): string => {
    switch (level) {
      case LogLevel.QUIET:
        return '';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.DEBUG:
        return 'debug';
    }
  })(configuration.log.level),
  format: format.combine(
    format.timestamp({
      format: () => dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ssX'),
    }),
    format.printf((log) => {
      const context: string = log.context;
      const level: string = log.level;
      const message: unknown = log.message;
      const timestamp: string = log.timestamp;

      const color = ((level) => {
        switch (level) {
          case 'info':
            return green;
          case 'error':
            return red;
          case 'warn':
            return yellow;
          case 'debug':
            return magentaBright;
          case 'verbose':
            return cyanBright;
          default:
            return gray;
        }
      })(level);

      return [
        gray(timestamp),
        color(level.toUpperCase().padStart(MAX_LEVEL_LENGTH)),
        yellow`[${context}]`,
        log.stack == null ? String(message) : log.stack,
      ].join(' ');
    }),
  ),
  transports: <TransportStream[]>[
    new Console() as TransportStream,
    configuration.log.driver.enabled
      ? new ContextAwareLokiTransport({
          labels: {
            app: 'virginity-bot',
            host: hostname(),
          },
          host: configuration.log.driver.origin,
          basicAuth:
            configuration.log.driver.password != null
              ? `${configuration.log.driver.username}:${configuration.log.driver.password}`
              : undefined,
          // format:
        })
      : null,
  ].filter((t): t is TransportStream => t != null),
});
