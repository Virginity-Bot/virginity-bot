#!/usr/bin/env sh
set -e

username="admin"
password="password"

# ensure the `mc` bin is available
if ! type "mc" > /dev/null; then
  if [ ! -f "/opt/bin/mc" ]; then
    gunzip --keep "/opt/bin/mc.gz"
  fi
  chmod +x "/opt/bin/mc"
fi

# wait for MinIO to come up
sleep 5

mc alias set vbot http://object-storage:9000 "$username" "$password"
mc mb vbot/intro-songs
