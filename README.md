# Static Web + Rust/WASM GitHub Pages Template

> **GitHub Pages URL (template-safe):** `https://<owner>.github.io/<repo>/`  
> Replace `<owner>` with your GitHub username or organization, and `<repo>` with the repository name created from this template.

A minimal template for creating many small static web projects with:

- Vanilla JavaScript (ES modules)
- Rust compiled to WebAssembly via `wasm-bindgen` + `wasm-pack`
- Static deployment to GitHub Pages using GitHub Actions
- No Node.js requirement

## Project layout

- `web/`: source static assets (`index.html`, JS, CSS)
- `crates/wasm_core/`: Rust crate compiled to WebAssembly
- `scripts/`: build/dev/test helpers
- `dist/`: generated deploy output (gitignored)

## Prerequisites

- Rust toolchain (pinned in `rust-toolchain.toml`)
- `wasm-pack` (required for production builds)
- Python 3 (for local static server)

## Local build

```bash
./scripts/build.sh
```

This command:

1. Builds `crates/wasm_core` into WebAssembly with `wasm-pack` targeting the web.
2. Writes generated wasm bindings into `dist/wasm`.
3. Copies static web files from `web/` to `dist/`.

After a build, deploy-ready output lives in `dist/`:

- `dist/index.html`
- `dist/js/`
- `dist/css/`
- `dist/wasm/`

## Run locally

```bash
./scripts/dev.sh
```

This rebuilds and serves `dist/` at <http://localhost:8000>.

## Run checks

```bash
./scripts/test.sh
```

Runs:

- `cargo test`
- `cargo fmt --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `./scripts/build.sh` smoke check

### Environment-limited testing fallback

For CI/dev environments where `wasm-pack` cannot be installed, use:

```bash
ALLOW_WASM_STUB=1 ./scripts/build.sh
```

This generates a minimal `dist/wasm/wasm_core.js` stub so browser and asset pipeline tests still run consistently without network/toolchain bootstrap. GitHub workflows force real wasm builds with `WASM_PACK_REQUIRED=1`.

## WASM proof of integration

The Rust crate exports:

```rust
pub fn add(a: i32, b: i32) -> i32
```

and a `NoiseField` renderer that generates animated simplex-noise RGBA frames in optimized wasm for the canvas background.

`web/js/main.js` initializes the generated wasm module, calls `add(1, 2)`, and uses the wasm noise renderer for the demo background when available.

## GitHub Pages deployment

Deployment is defined in `.github/workflows/pages.yml`:

- Triggers on push to `main` (and manual dispatch)
- Builds the site with `./scripts/build.sh`
- Uploads `dist/` as a Pages artifact
- Deploys with `actions/deploy-pages`

No `gh-pages` branch is required. Configure repository settings to use **Pages → Source: GitHub Actions**.

Expected site URL after deploy:

- User/org site repo: `https://<owner>.github.io/` (only when repository name is exactly `<owner>.github.io`)
- Project site repo (most template uses): `https://<owner>.github.io/<repo>/`

## Demo behavior

The default template demo renders a full-window canvas where:

- Animated simplex-noise background runs behind the text (wasm renderer in production builds)
- `Flags!` bounces within the viewport with delta-time animation
- Clicking/tapping anywhere changes the text color randomly
- Resize/orientation changes are handled
