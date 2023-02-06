#!/usr/bin/env sh

DOTENV_CONFIG_OVERRIDE=true \
FORCE_COLOR=1 \
  nest start \
    --watch --preserveWatchOutput \
    --exec 'node --require dotenv/config --inspect-brk=0.0.0.0'
