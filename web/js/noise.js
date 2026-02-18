import { config } from "./config.js";

export class NoiseBackground {
  constructor(canvas, wasmModule) {
    this.canvas = canvas;
    this.wasm = wasmModule;
    this.engine = this.#createEngine(wasmModule);
    this.bufferCanvas = document.createElement("canvas");
    this.bufferContext = this.bufferCanvas.getContext("2d", { alpha: false });
    this.imageData = null;
    this.noiseWidth = 0;
    this.noiseHeight = 0;
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);

    this.noiseWidth = Math.max(1, Math.floor(width * config.noiseResolutionScale));
    this.noiseHeight = Math.max(1, Math.floor(height * config.noiseResolutionScale));

    this.bufferCanvas.width = this.noiseWidth;
    this.bufferCanvas.height = this.noiseHeight;
    this.imageData = this.bufferContext.createImageData(this.noiseWidth, this.noiseHeight);

    if (this.engine) {
      this.engine.resize(this.noiseWidth, this.noiseHeight);
    }
  }

  render(ctx, elapsedSeconds) {
    if (!this.imageData) {
      this.resize();
    }

    if (this.engine) {
      this.engine.render_frame(elapsedSeconds, config.noiseScale, config.noiseTimeScale);
      const ptr = this.engine.buffer_ptr();
      const len = this.engine.buffer_len();
      const src = new Uint8Array(this.wasm.memory.buffer, ptr, len);
      this.imageData.data.set(src);
    } else {
      this.#renderFallback(elapsedSeconds);
    }

    this.bufferContext.putImageData(this.imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.bufferCanvas, 0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  #createEngine(wasmModule) {
    if (!wasmModule || !wasmModule.NoiseField || !wasmModule.memory) {
      return null;
    }

    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    return new wasmModule.NoiseField(seed);
  }

  #renderFallback(elapsedSeconds) {
    const data = this.imageData.data;
    const w = this.noiseWidth;
    const h = this.noiseHeight;
    let i = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const nx = x * config.noiseScale;
        const ny = y * config.noiseScale;
        const v = this.#fbmValueNoise(nx, ny, elapsedSeconds * config.noiseTimeScale);
        const n = Math.max(0, Math.min(1, (v + 1) * 0.5));

        data[i] = Math.floor(8 + 92 * n);
        data[i + 1] = Math.floor(14 + 78 * n);
        data[i + 2] = Math.floor(28 + 190 * n);
        data[i + 3] = 255;
        i += 4;
      }
    }
  }

  #fbmValueNoise(x, y, t) {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;

    for (let octave = 0; octave < 4; octave += 1) {
      const ox = t * (0.13 + octave * 0.07);
      const oy = t * (0.17 + octave * 0.05);
      sum += this.#valueNoise2D(x * freq + ox, y * freq + oy) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }

    return sum / norm;
  }

  #valueNoise2D(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = x - x0;
    const sy = y - y0;

    const n00 = this.#hash2(x0, y0);
    const n10 = this.#hash2(x1, y0);
    const n01 = this.#hash2(x0, y1);
    const n11 = this.#hash2(x1, y1);

    const ix0 = this.#lerp(n00, n10, this.#smoothstep(sx));
    const ix1 = this.#lerp(n01, n11, this.#smoothstep(sx));
    return this.#lerp(ix0, ix1, this.#smoothstep(sy));
  }

  #hash2(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h ^= h >>> 16;
    return ((h >>> 0) / 0xffffffff) * 2 - 1;
  }

  #smoothstep(v) {
    return v * v * (3 - 2 * v);
  }

  #lerp(a, b, t) {
    return a + (b - a) * t;
  }
}
