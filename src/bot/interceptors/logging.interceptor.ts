import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CommandInteraction,
  Events,
  GuildMember,
  Presence,
  VoiceState,
} from 'discord.js';
import { Observable, tap } from 'rxjs';
import { red } from 'chalk';

import { boldify } from 'src/utils/logs';
import { PrometheusService } from 'src/prometheus/prometheus.service';

const metadata_name = 'vbot_req_logging';

/** Tells the `TimingLogInterceptor` how to label logs. */
export function TimingLogContext(custom_context: string) {
  return SetMetadata(metadata_name, custom_context);
}

/** Logs data about requests, including timing. */
@Injectable()
export class TimingLogInterceptor implements NestInterceptor {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    private readonly prometheus: PrometheusService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const component_name = context.getClass().name;
    const custom_context = this.reflector.get<string>(
      metadata_name,
      context.getHandler(),
    );

    const logger = new Logger(
      `${TimingLogInterceptor.name}, ${component_name}`,
    );

    const args = context.getArgs();
    const type: { event: Events } = args.at(-1);

    let start: number;
    let interaction_id: string | undefined;
    let guild_id: string | undefined;
    let user_id: string | undefined;
    let request: string | undefined = custom_context;

    switch (type.event) {
      case Events.InteractionCreate: {
        const interaction: CommandInteraction = args[0];
        start = Date.now();
        interaction_id = interaction.id;
        guild_id = interaction.guild?.id;
        user_id = interaction.user.id;
        request ??=
          interaction.command != null ? `/${interaction.command?.name}` : '?';

        break;
      }
      case Events.GuildMemberUpdate: {
        const new_state: GuildMember = args[1];
        start = Date.now();
        // interaction_id = new_state.id;
        guild_id = new_state.guild.id;
        user_id = new_state.user.id;
        request ??= 'user_update';
        break;
      }
      case Events.VoiceStateUpdate: {
        const new_state: VoiceState = args[1];
        start = Date.now();
        interaction_id = new_state.id;
        guild_id = new_state.guild.id;
        user_id = new_state.member?.user.id;
        request ??= 'voice_state_update';
        break;
      }
      case Events.PresenceUpdate: {
        const new_state: Presence = args[1];
        start = Date.now();
        guild_id = new_state.guild?.id;
        user_id = new_state.member?.user.id;
        request ??= 'presence_update';
        break;
      }
      case Events.ClientReady: {
        return next.handle();
      }
      default: {
        logger.warn(boldify`Unhandled event type: ${red(type.event)}`);
        return next.handle();
      }
    }

    return next.handle().pipe(
      tap(() => {
        const response_time_ms = Date.now() - start;

        logger.log({
          interaction_id,
          guild_id,
          user_id,
          request,
          response_time_ms,
        });
        this.prometheus.response_time_s.observe(response_time_ms / 1000);
      }),
    );
  }
}
