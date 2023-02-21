#!/usr/bin/env bash

# @param $1 The container name.
# @returns The container's status.
#   One of "created", "restarting", "running", "removing", "paused", "exited" or "dead"
get_container_status() {
  docker inspect "$1" | jq --raw-output '.[0].State.Status'
}

# @param $1 A Discord bot token.
prepare() {
  DISCORD_TOKEN="$1"

  # Create an empty .env so that docker compose is happy.
  touch .env

  # Create supporting containers.
  docker compose \
    --project-name "vbot-helper" \
    --file "docker-compose.dev.yaml" \
    up \
    --detach \
    --quiet-pull \
    db object-storage

  # Create vbot server container.
  IMAGE="bot:latest" \
  DISCORD_TOKEN="$DISCORD_TOKEN" \
    docker compose \
      --project-name "vbot-server" \
      --file "test/docker-compose.test.yaml" \
      up \
      --detach \
      --quiet-pull
}

test_container() {
  container="vbot-server_server-1"

  if
    # The container didn't start properly.
    [[ "$(get_container_status "$container")" != "running" ]]
  then
    exit 1
  fi

  attempts=0
  while
    # Ensure the container is still running.
    [[ "$(get_container_status "$container")" == "running" ]] && \
    # The logs don't yet indicate a successful startup.
    ! [[ "$(docker logs "$container")" =~ "Nest application successfully started" ]]
  do
    if
      # Limit how long we wait.
      [ "$attempts" -gt 10 ] ||
      # Ensure the container is still running.
      [[ "$(get_container_status "$container")" != "running" ]]
    then
      echo "=== Start Container Logs ==="
      echo "$(docker logs "$container")"
      echo "=== End Container Logs ==="
      echo "CONTAINER DID NOT COME UP SUCCESSFULLY"
      exit 1
    else
      attempts=$((attempts+1))
      sleep 1
    fi
  done
}

main() {
  prepare "$1"
  test_container
}

main $@
