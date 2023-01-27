# Contributing

What a gamer! We'd love to see where you want to take Virginity Bot!

## Getting Started

1. Create a private Discord bot for testing

    1. Enable `Presence Intent` and `Server Member Intent`.
    1. Add the `TOKEN` to your `/.env`

1. Install Docker & Docker Compose.
1. Start the server & dependencies.

    ```sh
    docker-compose -f docker-compose.dev.yaml up --build server -d
    ```

1. Setup MinIO.

    1. Go to http://localhost:9001 and login with the root credentials in the [`docker-compose.dev.yaml` file](/docker-compose.dev.yaml).
    1. [Create a new bucket](http://localhost:9001/buckets/add-bucket) named `intro-songs`.
    1. [Create a new access key](http://localhost:9001/access-keys/new-account) and add the values to your `/.env`.

1. Connect your debugger.

    The server container forwards port `9229`, so you should be able to connect a NodeJS debugger there.

## Upgrading NodeJS versions

There are a few places where the node version number needs to be bumped in order to upgrade. Unfortunately, not all of them share the same syntax.

1. [`Dockerfile`](/Dockerfile)'s `NODE_VERSION` `ARG`.
1. [`.nvmrc`](/.nvmrc)
