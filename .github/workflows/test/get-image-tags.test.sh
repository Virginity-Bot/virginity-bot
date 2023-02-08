#!/usr/bin/env bash

script="$(cat "$(dirname "$BASH_SOURCE")/../scripts/get-image-tags.sh")"

_script=$( \
  echo "$script" \
  `# use GNU coreutils` \
  | perl -ne 's/(?<=\b)tr(?=\b)/gtr/g; print' \
  | perl -ne 's/(?<=\b)sed(?=\b)/gsed/g; print' \
)

export GITHUB_OUTPUT="/dev/stdout"

printf "====== Start feature branch test ======\n"
tmp_dir="$(dirname "$BASH_SOURCE")/temp"
mkdir -p "$tmp_dir"
tmp_file="$tmp_dir/get-image-tags.sh"
echo "$_script" > "$tmp_file"
bash "$tmp_file" \
  "Virginity-Bot/virginity-bot" \
  "feat/Foo---bar" \
  "branch" \
  "master"
printf "====== End feature branch test ======\n\n"

printf "====== Start default branch test ======\n"
tmp_dir="$(dirname "$BASH_SOURCE")/temp"
mkdir -p "$tmp_dir"
tmp_file="$tmp_dir/get-image-tags.sh"
echo "$_script" > "$tmp_file"
bash "$tmp_file" \
  "Virginity-Bot/virginity-bot" \
  "master" \
  "branch" \
  "master"
printf "====== End default branch test ======\n\n"

printf "====== Start tag test ======\n"
tmp_dir="$(dirname "$BASH_SOURCE")/temp"
mkdir -p "$tmp_dir"
tmp_file="$tmp_dir/get-image-tags.sh"
echo "$_script" > "$tmp_file"
bash "$tmp_file" \
  "Virginity-Bot/virginity-bot" \
  "master" \
  "tag" \
  "master"
printf "====== End tag test ======\n\n"

