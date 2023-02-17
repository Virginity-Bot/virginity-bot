#!/usr/bin/env bash

echo "Bumping... "
re='^[0-9]+$'
list='major minor patch'
message='🚀🔖 release v%s'
echo $message

if [[ -z "$1" ]] ; then
      npm version --message "$message" patch
      exit 1
fi

if ! [[ $1 =~ $re ]] ; then
  if [[ $list =~ (^|[[:space:]])$1($|[[:space:]]) ]] ; then
    if [[ ! -z "$2" ]] ; then
      npm version $1 -m $message
    else
      npm version $1 $2 -m $message
    fi
  fi
fi
