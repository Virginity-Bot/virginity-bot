import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import {
  Events,
  TextChannel,
  NewsChannel,
  VoiceChannel,
  StageChannel,
  ForumChannel,
  Snowflake,
  CloseEvent,
} from 'discord.js';

@Injectable()
export class Logging {
  private readonly logger = new Logger(Logging.name);

  /**
   * @param shard_id The shard that encountered this error
   * @param unavailableGuilds Set of unavailable guild ids, if any
   */
  @On(Events.ShardReady)
  onShardReady(shard_id: number, unavailableGuilds: Set<Snowflake>) {
    this.logger.debug(`Shard ${shard_id} ready.`);
  }

  /**
   * @param event The WebSocket close event
   * @param shard_id The shard id that disconnected
   */
  @On(Events.ShardDisconnect)
  onShardDisconnect(event: CloseEvent, shard_id: number) {
    this.logger.warn(event, `shardID: ${shard_id}`);
  }

  /**
   * @param error The encountered error
   * @param shard_id The shard that encountered this error
   */
  @On(Events.ShardError)
  onShardError(error: Error, shard_id: number) {
    this.logger.warn(error, `shardID: ${shard_id}`);
  }

  /**
   * @param shard_id The shard that encountered this error
   */
  @On(Events.ShardReconnecting)
  onShardReconnecting(shard_id: number) {
    this.logger.debug(`Shard ${shard_id} reconnecting.`);
  }

  @On(Events.WebhooksUpdate)
  async onWebhooksUpdate(
    channel:
      | TextChannel
      | NewsChannel
      | VoiceChannel
      | StageChannel
      | ForumChannel,
  ) {
    this.logger.debug(channel);
  }

  @On(Events.Error)
  async onError(error: Error) {
    this.logger.error(error);
  }

  @On(Events.Debug)
  async onDebug(info: string) {
    this.logger.debug(info);
  }

  @On(Events.Warn)
  async onWarn(info: string) {
    this.logger.warn(info);
  }
}
