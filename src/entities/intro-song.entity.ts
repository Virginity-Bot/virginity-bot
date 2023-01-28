import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  TextType,
} from '@mikro-orm/core';
import { URL } from 'url';

import { BaseEntity } from './base.entity';

@Entity({ tableName: 'intro_song' })
export class IntroSongEntity extends BaseEntity {
  /** The hash of uploaded audio file. Uses SHA-256. */
  @PrimaryKey({
    type: TextType,
    comment: 'The hash of uploaded audio file. Uses SHA-256.',
  })
  hash: string;

  /** The name of the intro song. */
  @Property({ type: TextType, comment: 'The name of the intro song.' })
  name: string;

  /** The MIME type of the file. */
  @Property({ type: TextType, comment: 'The MIME type of the file.' })
  mime_type: string;

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
  uri: string;

  #parsed_uri?: URL;

  /** @example 's3' */
  get protocol() {
    this.#parsed_uri ??= new URL(this.uri);
    const proto = this.#parsed_uri.protocol;
    return proto.slice(0, proto.at(-1) === ':' ? -1 : 0).toLowerCase();
  }

  /** @example 'intro-songs' */
  get bucket() {
    this.#parsed_uri ??= new URL(this.uri);
    return this.#parsed_uri.host;
  }

  /** @example '/sample.mp3' */
  get object_name() {
    this.#parsed_uri ??= new URL(this.uri);
    return this.#parsed_uri.pathname;
  }
}
