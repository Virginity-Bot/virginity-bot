#!/usr/bin/env bash

echo "Bumping... "
message='🚀🔖 release v%s'

if [[ -z "$1" ]] ; then
      npm version --message "$message" patch
      exit 0
else
  npm version --message "$message" $1
  exit 0
fi
