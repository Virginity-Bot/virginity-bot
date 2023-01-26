# VirginityBot <img alt="logo" src="assets/logo.png" height="20rem" />

Discord Bot to track peoples' virginity, i.e. their accumulated online time on the server.

[Invite the official Virginity Bot to your Server](https://discord.com/api/oauth2/authorize?client_id=943974476469645333&permissions=2452817936&scope=bot)

## Supported Commands

-   `/leaderboard` - List biggest virgins in the server.
-   `/check` - Checks virginity of a given user.
-   `/reset` - Resets a specified member's virginity.

## How to Increase Your Virginity

1. Join a public voice chat
1. Virgins must not be muted or deafened
1. Virgins may not be in the AFK channel
1. Stream for more virginity points :)
1. Share camera for even more points! :D

## Run your own Virginity Bot

1. (Create a new Discord Application](https://discord.com/developers/applications/]
    1. Retrieve your Bot Token from the bot tab
2. Make sure to set the [/.env](/.env) variables appropriately.
3. Run npm start to start the bot

## Permissions

-   **Manage Roles** - Required to create and move the biggest virgin role.
-   **Manage Nickname**
-   **Change Nickname**
-   **Send Messages** - Required to respond to commands.
-   **Read Message History** - Required to respond to commands.
-   **Connect**, **Speak** - Required for playing the biggest virgin's intro theme.
-   **Voice Activity** - Required for counting users virginity.

## Upgrading NodeJS versions

There are a few places where the node version number needs to be bumped in order to upgrade. Unfortunately, not all of them share the same syntax.

1. [`Dockerfile`](/Dockerfile)'s `NODE_VERSION` `ARG`.
1. [`.nvmrc`](/.nvmrc)
