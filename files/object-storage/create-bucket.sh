#!/usr/bin/env sh
set -e

origin="${1:-http://object-storage:9000}"
username="${2:-admin}"
password="${3:-password}"

max_retries=2

# ensure the `mc` bin is available
if ! type "mc" > /dev/null; then
  if [ ! -f "/opt/bin/mc" ]; then
    gunzip --keep "/opt/bin/mc.gz"
  fi
  chmod +x "/opt/bin/mc"
fi

# wait for MinIO to come up
retries=0
set +e;
while [ true ]; do
  curl --silent --url "$origin" > /dev/null
  if [ "$?" -eq 0 ]; then
    break
  else
    retries=$((retries+1))
    if [ "$retries" -eq "$max_retries" ]; then
      exit 1
    else
      sleep 2
    fi
  fi
done
set -e;

mc alias set vbot "$origin" "$username" "$password" > /dev/null

set +e; output="$(mc mb vbot/intro-songs 2>&1)"; set -e

if \
  [[ "$output" =~ "Your previous request to create the named bucket succeeded" ]] || \
  [[ "$output" =~ "Bucket created successfully" ]] \
; then
  exit 0
else
  echo "Failed to create bucket."
  echo "$output"
  exit 1
fi
