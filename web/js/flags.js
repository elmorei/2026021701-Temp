import { config } from "./config.js";

export class FlagsBouncer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.text = "Flags!";
    this.speed = config.speed;
    this.textSize = config.textSize;
    this.fontFamily = config.fontFamily;
    this.color = this.#randomColor();

    const angle = Math.random() * Math.PI * 2;
    this.velocity = {
      x: Math.cos(angle) * this.speed,
      y: Math.sin(angle) * this.speed,
    };

    this.position = { x: 0, y: 0 };
    this.metrics = { width: 0, height: this.textSize };
    this.lastTime = null;

    this.#refreshMetrics();
    this.#centerText();
  }

  resize() {
    this.#refreshMetrics();
    this.position.x = Math.min(this.position.x, this.#boundsWidth() - this.metrics.width);
    this.position.y = Math.min(this.position.y, this.#boundsHeight());
    this.position.x = Math.max(0, this.position.x);
    this.position.y = Math.max(this.metrics.height, this.position.y);
  }

  randomizeColor() {
    this.color = this.#randomColor();
  }

  start() {
    if (this.animationFrame) {
      return;
    }

    const frame = (time) => {
      if (this.lastTime === null) {
        this.lastTime = time;
      }

      const deltaSeconds = (time - this.lastTime) / 1000;
      this.lastTime = time;
      this.#update(deltaSeconds);
      this.#render();
      this.animationFrame = window.requestAnimationFrame(frame);
    };

    this.animationFrame = window.requestAnimationFrame(frame);
  }

  #update(dt) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    const rightBound = this.#boundsWidth() - this.metrics.width;
    const topBound = this.metrics.height;
    const bottomBound = this.#boundsHeight();

    if (this.position.x <= 0) {
      this.position.x = 0;
      this.velocity.x *= -1;
    } else if (this.position.x >= rightBound) {
      this.position.x = rightBound;
      this.velocity.x *= -1;
    }

    if (this.position.y <= topBound) {
      this.position.y = topBound;
      this.velocity.y *= -1;
    } else if (this.position.y >= bottomBound) {
      this.position.y = bottomBound;
      this.velocity.y *= -1;
    }
  }

  #render() {
    this.ctx.clearRect(0, 0, this.#boundsWidth(), this.#boundsHeight());
    this.ctx.font = `${this.textSize}px ${this.fontFamily}`;
    this.ctx.fillStyle = this.color;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText(this.text, this.position.x, this.position.y);
  }

  #refreshMetrics() {
    this.ctx.font = `${this.textSize}px ${this.fontFamily}`;
    const textMeasure = this.ctx.measureText(this.text);
    const ascent = textMeasure.actualBoundingBoxAscent || this.textSize;
    const descent = textMeasure.actualBoundingBoxDescent || 0;
    this.metrics.width = Math.ceil(textMeasure.width);
    this.metrics.height = Math.ceil(ascent + descent);
  }

  #centerText() {
    this.position.x = Math.max(0, (this.#boundsWidth() - this.metrics.width) / 2);
    this.position.y = Math.max(this.metrics.height, (this.#boundsHeight() + this.metrics.height) / 2);
  }

  #boundsWidth() {
    return this.canvas.clientWidth;
  }

  #boundsHeight() {
    return this.canvas.clientHeight;
  }

  #randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue} 90% 65%)`;
  }
}
