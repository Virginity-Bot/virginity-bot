import { Entity, PrimaryKey, Property, TextType } from '@mikro-orm/core';

import { IntervalType } from '../utils/interval-type';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'intro_song' })
export class IntroSongEntity extends BaseEntity {
  /** The hash of uploaded audio file. Uses SHA-256. */
  @PrimaryKey({
    type: TextType,
    comment: 'The hash of uploaded audio file. Uses SHA-256.',
  })
  readonly hash: string;

  /** The name of the intro song. */
  @Property({
    type: TextType,
    comment: 'The name of the intro song.',
    index: true,
  })
  readonly name: string;

  /** The MIME type of the file. */
  @Property({ type: TextType, comment: 'The MIME type of the file.' })
  readonly mime_type: string;

  /** The duration of the intro song. */
  @Property({
    name: 'duration',
    type: IntervalType,
    comment: 'The duration of the intro song.',
  })
  readonly duration_ms: number;

  /** The length of time before next play. */
  @Property({
    name: 'computed_timeout',
    type: IntervalType,
    comment: 'The length of time before next play.',
  })
  readonly computed_timeout_ms: number;

  /**
   * Reference to an audio file.
   *
   * Supports the following schemas:
   *
   * - s3://
   * - vbot-builtin://
   */
  @Property({
    type: TextType,
    comment: `Reference to an audio file. Supports s3:// and vbot-builtin:// schemas.`,
  })
  readonly uri: string;

  /** Whether or not this song should be visible to other users. */
  @Property({
    comment: 'Whether or not this song should be visible to other users.',
    index: true,
  })
  public = true;

  private _parsed_uri?: URL;

  /** @example 's3' */
  get protocol() {
    this._parsed_uri ??= new URL(this.uri);
    const proto = this._parsed_uri.protocol;
    return proto.slice(0, proto.at(-1) === ':' ? -1 : 0).toLowerCase();
  }

  /** @example 'intro-songs' */
  get bucket() {
    this._parsed_uri ??= new URL(this.uri);
    return this._parsed_uri.host;
  }

  /** @example '/sample.mp3' */
  get object_name() {
    this._parsed_uri ??= new URL(this.uri);
    return this._parsed_uri.pathname;
  }
}
