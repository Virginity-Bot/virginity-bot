import { Readable, Stream } from 'stream';
import { spawn, exec, fork } from 'child_process';
import { Injectable, Logger } from '@nestjs/common';
import { path as ffprobe_path } from 'ffprobe-static';
import * as ffmpeg_path from 'ffmpeg-static';
import { Duration, parse } from 'date-fns';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  private readonly ffmpeg_bin: string;
  private readonly ffprobe_bin: string;

  constructor() {
    if (ffmpeg_path == null) {
      throw new Error(
        `ffmpeg_path was null. Maybe ffmpeg-static was not installed correctly?`,
      );
    }
    this.ffmpeg_bin = ffmpeg_path as unknown as string;
    this.ffprobe_bin = ffprobe_path;
  }

  /** Gets the duration of the 1st audio track in a file in seconds. */
  getTrackDuration(audio_file: Buffer): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const proc = spawn(
        this.ffmpeg_bin,
        // prettier-ignore
        [
          // read input from stdin
          '-i', 'pipe:0',

          // disable video
          '-vn',

          // '-loglevel', 'quiet',

          // output null
          '-f', 'null',
          // output to stdout
          'pipe:1'
        ],
      );

      let console_log = '';
      proc.stderr.on('data', (data: string) => {
        console_log += data.toString();
      });
      proc.on('close', (exit_code) => {
        if (exit_code !== 0)
          return reject(new Error(`exit code ${exit_code}.\n${console_log}`));

        const times = console_log.match(/(?<=\btime=)(\d\d:\d\d:\d\d.\d\d)\b/g);
        const duration =
          parse(
            times?.[times.length - 1] ?? '00:00:00.00',
            'HH:mm:ss.SS',
            new Date(0),
          ).getTime() / 1000;

        return resolve(duration);
      });
      proc.on('error', (err) => {
        this.logger.error(err);
        this.logger.error(console_log);
      });

      Readable.from(audio_file).pipe(proc.stdin);
    });
  }
}
