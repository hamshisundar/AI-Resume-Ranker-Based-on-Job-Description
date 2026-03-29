#!/usr/bin/env bash
# Start the Flask API for local development (from backend/).
set -euo pipefail
cd "$(dirname "$0")"
export SECRET_KEY="${SECRET_KEY:-dev-secret-change-me}"
export PORT="${PORT:-5050}"
exec python3 run.py
