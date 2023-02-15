import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
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

export class LoggingInterceptor implements NestInterceptor {
  private readonly logger;

  constructor(component: string, private readonly custom_context?: string) {
    this.logger = new Logger(`${LoggingInterceptor.name}, ${component}`);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const args = context.getArgs();
    const type: { event: Events } = args.at(-1);

    let start: number;
    let interaction_id: string | undefined;
    let guild_id: string | undefined;
    let user_id: string | undefined;
    let request: string | undefined = this.custom_context;

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
        this.logger.warn(boldify`Unhandled event type: ${red(type.event)}`);
        return next.handle();
      }
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          interaction_id,
          guild_id,
          user_id,
          request,
          response_time_ms: Date.now() - start,
        });
      }),
    );
  }
}
