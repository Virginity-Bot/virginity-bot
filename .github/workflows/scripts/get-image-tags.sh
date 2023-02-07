#!/usr/bin/env bash

GITHUB_REPOSITORY="$1"
GITHUB_REF_NAME="$2"
GITHUB_REF_TYPE="$3"
GITHUB_EVENT_REPOSITORY_DEFAULT_BRANCH="$4"

container_repo="ghcr.io/$(echo "$GITHUB_REPOSITORY" | tr '[A-Z]' '[a-z]')"
versions="$(
  echo "$GITHUB_REF_NAME" \
  | tr '[A-Z]' '[a-z]' \
  | perl -ne 's/[^a-z0-9._\n]+/-/g; print' \
)"
if [[ "$GITHUB_REF_TYPE" == "branch" ]]; then
  package_json_version="$(jq --raw-output '.version' 'package.json')"
  versions="$versions,$package_json_version"
fi

echo "$versions"

# Use Docker `latest` tag convention, only tagging `latest` on default branch.
if [[ "$versions" =~ ,?$GITHUB_EVENT_REPOSITORY_DEFAULT_BRANCH,? ]]; then
  versions="$versions,latest"
fi

versions=$(echo $versions | tr ',' '\n')
image_tags="bot"
for version in $versions; do
  image_tags="$image_tags,$container_repo/bot:$version"
done

echo "image_tags=$image_tags" >> "$GITHUB_OUTPUT"
