#!/usr/bin/env bash

echo "Bumping... "
message='🚀🔖 release v%s'

if [[ -z "$1" ]] ; then
      npm version --message "$message" patch
      exit 1
else
  npm version --message "$message" $1
  exit 1
fi
