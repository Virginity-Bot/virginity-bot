#!/usr/bin/env sh

DOTENV_CONFIG_OVERRIDE=true \
  nest start \
    --exec 'node --require dotenv/config'
