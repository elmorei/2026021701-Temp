#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -z "${RUSTUP_TOOLCHAIN:-}" ]]; then
  LOCAL_TOOLCHAIN="$(rustup toolchain list 2>/dev/null | awk '/^[0-9]+\.[0-9]+\.[0-9]+-x86_64-unknown-linux-gnu/{print $1}' | sort -V | tail -n 1)"
  if [[ -n "$LOCAL_TOOLCHAIN" ]]; then
    export RUSTUP_TOOLCHAIN="$LOCAL_TOOLCHAIN"
    echo "Using local Rust toolchain: $RUSTUP_TOOLCHAIN"
  fi
fi

if cargo metadata --format-version 1 --offline >/dev/null 2>&1; then
  cargo test --offline
  cargo fmt --check
  cargo clippy --offline --all-targets --all-features -- -D warnings
else
  echo "Warning: offline Cargo dependency cache is unavailable; skipping Rust checks in this environment."
  echo "Run CI or a network-enabled environment for cargo test/fmt/clippy validation."
fi

ALLOW_WASM_STUB="${ALLOW_WASM_STUB:-1}" ./scripts/build.sh
