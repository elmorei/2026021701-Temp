#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
WEB_DIR="$ROOT_DIR/web"
WASM_OUT_DIR="$DIST_DIR/wasm"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

build_with_wasm_pack() {
  wasm-pack build "$ROOT_DIR/crates/wasm_core" \
    --target web \
    --release \
    --out-dir ../../dist/wasm
}

build_stub_wasm() {
  mkdir -p "$WASM_OUT_DIR"
  cat > "$WASM_OUT_DIR/wasm_core.js" <<'STUB'
export default async function init() {
  return Promise.resolve();
}

export function add(a, b) {
  return a + b;
}
STUB
  echo "Warning: wasm-pack not found; generated JS stub at dist/wasm/wasm_core.js"
}

if command -v wasm-pack >/dev/null 2>&1; then
  build_with_wasm_pack
elif [[ "${WASM_PACK_REQUIRED:-0}" != "1" && "${ALLOW_WASM_STUB:-0}" == "1" ]]; then
  build_stub_wasm
else
  echo "Error: wasm-pack is required. Install wasm-pack or (outside CI) set ALLOW_WASM_STUB=1 for environment-limited smoke tests."
  exit 1
fi

cp "$WEB_DIR/index.html" "$DIST_DIR/index.html"
cp -R "$WEB_DIR/js" "$DIST_DIR/js"
cp -R "$WEB_DIR/css" "$DIST_DIR/css"

echo "Build complete: $DIST_DIR"
