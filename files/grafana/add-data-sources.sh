#!/usr/bin/env sh
set -e

username="admin"
password="password"

# wait for Grafana to come up
sleep 5

curl --request POST \
  --url "http://$username:$password@grafana:3000/api/datasources" \
  --header 'Content-Type: application/json' \
  --data '{
    "name":"Loki",
    "type":"loki",
    "url":"http://loki:3100",
    "access":"proxy",
    "basicAuth":false
  }'

curl --request POST \
  --url "http://$username:$password@grafana:3000/api/datasources" \
  --header 'Content-Type: application/json' \
  --data '{
    "name":"Prometheus",
    "type":"prometheus",
    "url":"http://prometheus:9090",
    "access":"proxy",
    "basicAuth":false
  }'
