#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
  echo "[AI-SERVICE] Creating virtual environment..."
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source ".venv/bin/activate"

echo "[AI-SERVICE] Installing/refreshing dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo "[AI-SERVICE] Starting Flask AI service on port 8000..."
python app.py
