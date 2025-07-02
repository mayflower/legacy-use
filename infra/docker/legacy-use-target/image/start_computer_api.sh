#!/bin/bash
echo "Starting computer api"
.venv/bin/uvicorn computer_api:app --host 0.0.0.0 --port 8088 --workers 1