#!/bin/bash
set -e

# 1. Get the directory where this script lives (backend/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 2. Go up one level to the backend root
cd "$SCRIPT_DIR/.."

echo "Running Ruff (Linting)..."
ruff check .

echo "Running Black (Formatting)..."
black --check .

echo "All checks passed"