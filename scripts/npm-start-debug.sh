#!/usr/bin/env sh

DOTENV_CONFIG_OVERRIDE=true \
  nest start \
    --watch --preserveWatchOutput \
    --exec 'node --require dotenv/config --inspect-brk'
