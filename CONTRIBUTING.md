# Contributing

What a gamer! We'd love to see where you want to take Virginity Bot!

## Getting Started

1. [Create a private Discord bot for testing](https://discord.com/developers/applications/)

    1. Enable `Presence Intent` and `Server Member Intent`.
    1. Add the `TOKEN` to your `/.env`

1. Install Docker & Docker Compose.
1. Start the server & dependencies.

    ```sh
    docker-compose -f docker-compose.dev.yaml up --build server -d
    ```

1. Connect your debugger.

    The server container forwards port `9229`, so you should be able to connect a NodeJS debugger there.

## Upgrading NodeJS versions

There are a few places where the node version number needs to be bumped in order to upgrade. Unfortunately, not all of them share the same syntax.

1. [`package.json`](/package.json)'s `engines.node` value.
1. [`Dockerfile`](/Dockerfile)'s `NODE_VERSION` `ARG`.
1. [`Dockerfile.dev`](/Dockerfile.dev)'s `NODE_VERSION` `ARG`.
1. [`.nvmrc`](/.nvmrc)

## Gotchas

-   The bot joins a VC to play an intro song, but then immediately leaves without playing any audio

    Ensure that you've done your `npm install` inside the OS that you're running the bot in. In other words, you may have done your initial `npm install` on your macOS host OS, but then are running the bot inside a Docker container (AKA a Linux guest OS).
    This can lead to the incorrect binaries being downloaded for certain dependencies (eg. `ffmpeg-static`).
