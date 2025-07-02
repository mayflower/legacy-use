#!/bin/bash

docker build -t legacy-use-mgmt:local -f infra/docker/legacy-use-mgmt/Dockerfile .
docker build -t legacy-use-target:local -f infra/docker/legacy-use-target/Dockerfile .
