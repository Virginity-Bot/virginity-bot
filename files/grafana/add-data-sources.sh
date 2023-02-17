#!/usr/bin/env sh
set -e

protocol="http:"
host="grafana:3000"
username="${2:-admin}"
password="${3:-password}"
if [ ! -z "$1" ]; then
  set -- $(echo $1 | tr '/' ' ')
  protocol=$1
  host=$2
fi

max_retries=2

# @param $1 The name of the datasource
# @param $2 The type of the datasource
# @param $3 The URL of the datasource
add_datasource () {
  output=$(curl \
    --silent \
    --request POST \
    --url "$protocol//$username:$password@$host/api/datasources" \
    --header 'Content-Type: application/json' \
    --data "{
      \"name\": \"$1\",
      \"type\": \"$2\",
      \"url\": \"$3\",
      \"access\": \"proxy\",
      \"basicAuth\": false
    }")

  if \
    [[ "$output" =~ '"message":"data source with the same name already exists"' ]] || \
    [[ "$output" =~ '"message":"Datasource added"' ]] \
  ; then
    return
  else
    echo "Failed to add data source."
    echo "$output"
    exit 1
  fi
}

main() {
  # wait for Grafana to come up
  retries=0
  set +e;
  while [ true ]; do
    curl --silent --url "$protocol//$host" > /dev/null
    if [ "$?" -eq 0 ]; then
      break
    else
      retries=$((retries+1))
      if [ "$retries" -gt "$max_retries" ]; then
        echo "Could not reach Grafana at '$protocol//$host'."
        exit 1
      else
        sleep 2
        echo "Waiting for Grafana..."
      fi
    fi
  done
  set -e;

  add_datasource "Loki" "loki" "http://loki:3100"
  add_datasource "Prometheus" "prometheus" "http://prometheus:9090"

  echo "Added data-sources."
  exit 0
}

main $@
