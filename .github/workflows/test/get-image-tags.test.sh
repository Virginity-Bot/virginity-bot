#!/usr/bin/env bash

script="$(cat "$(dirname "$BASH_SOURCE")/../scripts/get-image-tags.sh")"

_script=$( \
  echo "$script" \
  `# replace github template vars with test vals` \
  | sed 's/\${{ github.repository }}/Virginity-Bot\/virginity-bot/g' \
  | sed 's/\${{ github.ref_name }}/feat\/foo---bar/g' \
  | sed 's/\${{ github.ref_type }}/branch/g' \
  | sed 's/\${{ github.event.repository.default_branch }}/master/g' \
  `# use GNU coreutils` \
  | perl -ne 's/(?<=\b)tr(?=\b)/gtr/g; print' \
  | perl -ne 's/(?<=\b)sed(?=\b)/gsed/g; print' \
)

export GITHUB_OUTPUT="/dev/stdout"

tmp_dir="$(dirname "$BASH_SOURCE")/tmp"
mkdir -p "$tmp_dir"
tmp_file="$tmp_dir/get-image-tags.sh"
echo "$_script" > "$tmp_file"
bash "$tmp_file"
