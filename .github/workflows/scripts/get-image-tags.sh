#!/usr/bin/env bash

container_repo="ghcr.io/$(echo "${{ github.repository }}" | tr '[A-Z]' '[a-z]')"
# Name components may contain lowercase letters, digits and separators.
# A separator is defined as a period, one or two underscores, or one or more hyphens.
# A name component may not start or end with a separator
versions="$(
  echo "${{ github.ref_name }}" \
  | tr '[A-Z]' '[a-z]' \
  | perl -ne 's/[^a-z0-9._\n]+/-/g; print' \
)"
if [[ "${{ github.ref_type }}" == "branch" ]]; then
  package_json_version="$(jq --raw-output '.version' 'package.json')"
  versions="$versions,$package_json_version"
fi

echo "$versions"

# Use Docker `latest` tag convention, only tagging `latest` on default branch.
if [[ "$versions" =~ ,?${{ github.event.repository.default_branch }},? ]]; then
  versions="$versions,latest"
fi

versions=$(echo $versions | tr ',' '\n')
image_tags="bot"
for version in $versions; do
  image_tags="$image_tags,$container_repo/bot:$version"
done

echo "image_tags=$image_tags" >> "$GITHUB_OUTPUT"
