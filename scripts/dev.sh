#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ALLOW_WASM_STUB="${ALLOW_WASM_STUB:-1}" "$ROOT_DIR/scripts/build.sh"

echo "Serving dist at http://localhost:8000"
cd "$ROOT_DIR/dist"
python3 -m http.server 8000
