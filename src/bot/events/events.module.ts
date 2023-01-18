import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';

import { CreateWitnessedGuilds } from './create-witnessed-guilds';
import { IntroMusic } from './intro-music';
import { Track } from './track';

@Module({
  imports: [DatabaseModule, DiscordModule.forFeature()],
  providers: [IntroMusic, Track, CreateWitnessedGuilds],
})
export class EventsModule {}
