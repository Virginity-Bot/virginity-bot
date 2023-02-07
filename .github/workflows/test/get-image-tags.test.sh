#!/usr/bin/env bash

script="$(cat "$(dirname "$BASH_SOURCE")/../scripts/get-image-tags.sh")"

_script=$( \
  echo "$script" \
  `# use GNU coreutils` \
  | perl -ne 's/(?<=\b)tr(?=\b)/gtr/g; print' \
  | perl -ne 's/(?<=\b)sed(?=\b)/gsed/g; print' \
)

export GITHUB_OUTPUT="/dev/stdout"

tmp_dir="$(dirname "$BASH_SOURCE")/temp"
mkdir -p "$tmp_dir"
tmp_file="$tmp_dir/get-image-tags.sh"
echo "$_script" > "$tmp_file"
bash "$tmp_file" \
  "Virginity-Bot/virginity-bot" \
  "feat/Foo---bar" \
  "branch" \
  "master"
