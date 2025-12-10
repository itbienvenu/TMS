#!/bin/bash

# Navigate to the project directory
cd /home/ubuntu/ticketing-system

# Check if all services are running and exit with a code
# -q: Quiet mode, only prints container IDs
# --filter status=running: Only checks running containers

# Get the count of EXPECTED running containers (9: 7 services + postgres + redis)
EXPECTED_COUNT=9 

# Get the count of ACTUAL running containers for your project
ACTUAL_COUNT=$(docker compose ps -q | xargs docker inspect --format='{{.State.Running}}' | grep -c true)

if [ "$ACTUAL_COUNT" -lt "$EXPECTED_COUNT" ]; then
  echo "ALERT: ONLY $ACTUAL_COUNT/$EXPECTED_COUNT containers running in ticketing-system stack."
  # Exit with non-zero code to indicate failure to CloudWatch
  exit 1
else
  echo "OK: All $ACTUAL_COUNT containers running."
  # Exit with zero code to indicate success
  exit 0
fi
