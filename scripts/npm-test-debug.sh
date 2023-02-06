#!/usr/bin/env sh

node \
  --inspect-brk \
  --require tsconfig-paths/register \
  --require ts-node/register \
  node_modules/.bin/jest --runInBand
