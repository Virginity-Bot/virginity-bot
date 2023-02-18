#!/usr/bin/env bash

echo "Bumping... "
message='🚀🔖 release v%s'

npm version --message "$message" $1
