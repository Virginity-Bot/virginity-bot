#!/usr/bin/env bash

echo "Bumping... "

if [[ -z "$1" ]] ; then
      npm version --message "$message" patch
      exit 1
else
  npm version $1 -m "$message"
  exit 1
fi
