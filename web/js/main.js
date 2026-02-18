import init, * as wasm from "../wasm/wasm_core.js";
import { FlagsBouncer } from "./flags.js";
import { NoiseBackground } from "./noise.js";

const canvas = document.getElementById("app-canvas");
const context = canvas.getContext("2d");

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(dpr, dpr);
}

async function main() {
  resizeCanvas();

  await init();
  const sum = wasm.add(1, 2);
  console.info(`wasm add(1, 2) = ${sum}`);

  const noiseBackground = new NoiseBackground(canvas, wasm);
  noiseBackground.resize();

  const bouncer = new FlagsBouncer(canvas, noiseBackground);
  bouncer.start();

  window.addEventListener("resize", () => {
    resizeCanvas();
    bouncer.resize();
  });

  window.addEventListener("click", () => {
    bouncer.randomizeColor();
  });
}

main().catch((error) => {
  console.error("Failed to start app", error);
});
