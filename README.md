# VirginityBot <img alt="logo" src="assets/logo.png" height="20rem" />

Discord Bot to track peoples' virginity, i.e. their accumulated online time on the server.

[Invite the official Virginity Bot to your Server](https://discord.com/api/oauth2/authorize?client_id=943974476469645333&permissions=312965532688&scope=bot)

## Supported Commands

-   `/score` - check your own virginity
-   `/leaderboard` - list top 10 virgins in the server
-   `/checkvirginity` - checks virginity of a given user
-   `/reset` - resets a specified member's virginity

## How to Increase Your Virginity

1. Virginity counter starts on initial voice channel join
2. Stream for more virginity points :)
3. Share camera for even more points! :D

### Potential Improvements

-   Alpha virgin role - rename to Ω Virgin?
-   Dockerize application
-   Add more commands
-   Have bot assign roles
-   Give bot scheduler, for wiping or announcing
-   Have Bot auto create/add channel for annoucements.
-   Suggestions Welcome.

## Run your own Virginity Bot

1. (Create a new Discord Application](https://discord.com/developers/applications/]
2. Retrive your Bot Token from the bot tab
3. Make sure to set the [/.env](/.env) variables appropriately.
4. Run npm start to start the bot

## Permissions

-   Manage Roles
    -   Required to create and move the biggest virgin role.
-   Manage Nickname
-   Change Nickname
-   Send Messages
    -   Required to respond to commands.
-   Read Message History
    -   Required to respond to commands.
-   Connect
    -   Required for playing the biggest virgin's intro theme.
-   Speak
    -   Required for playing the biggest virgin's intro theme.
-   Voice Activity
    -   Required for tracking users virginity.
