import { Readable } from 'stream';
import { spawn } from 'child_process';
import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg_path from 'ffmpeg-static';
import { parse } from 'date-fns';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  private readonly ffmpeg_bin: string;

  constructor() {
    if (ffmpeg_path == null) {
      throw new Error(
        `ffmpeg_path was null. Maybe ffmpeg-static was not installed correctly?`,
      );
    }
    this.ffmpeg_bin = ffmpeg_path as unknown as string;
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
        { shell: false },
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

  /**
   * @param intro_duration_s seconds
   * @returns timeout in minutes
   */
  calculateTimeoutMinutes(intro_duration_s: number) {
    const curve = 1.188;
    return curve ** intro_duration_s + 1;
  }

  /**
   * Normalizes the loudness level of an audio stream using EBU R 128.
   *
   * @param audio_file A streamable reperesentation of the audio file.
   * @param Lk Target Lₖ, or K-weighted loudness level.
   * @param TP Target True Peak.
   */
  normalizeLoudness(
    audio_file: Readable | Buffer,
    Lk: number = -37,
    TP: number = -1.5,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const proc = spawn(
        this.ffmpeg_bin,
        // prettier-ignore
        // normalizes loudness level in a single pass.
        [
          // read input from stdin
          // '-i', '-',
          '-i', 'pipe:0',

          // disable video
          '-vn',

          // adds the loudnorm filter
          '-filter:a', `loudnorm=I=${Lk}:TP=${TP}:LRA=11:print_format=summary`,

          // set output codec
          '-codec:a', 'libopus',
          // set output container
          '-f', 'ogg',
          // sets the audio sampling frequency
          '-ar', '48k',

          '-loglevel', 'error',

          // write output to stdout
          'pipe:1',
        ],
        { shell: false },
      );

      const output: number[] = [];
      proc.stdout
        .on('data', (d: Buffer) => output.push(...d.values()))
        .on('close', () => resolve(Buffer.from(output)));

      let console_log = '';
      proc.stderr.on('data', (data: Buffer) => {
        console_log += data.toString();
      });
      proc.on('close', (exit_code) => {
        if (exit_code !== 0)
          return reject(new Error(`exit code ${exit_code}.\n${console_log}`));
      });
      proc.on('error', (err) => {
        this.logger.error(err);
        this.logger.error(console_log);
      });

      Readable.from(audio_file)
        .pipe(proc.stdin)
        .on('error', (err) => {
          // it seems like ffprobe is terminating the stream early, causing the EPIPE error?
          // could this be related to not received the duration?
          this.logger.error(err);
        });
    });
  }
}
