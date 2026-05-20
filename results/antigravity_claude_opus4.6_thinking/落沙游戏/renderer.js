/**
 * Falling Sand Simulator — Renderer
 * Canvas rendering with optimized pixel manipulation
 */

class SandRenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: false });
        this.engine = engine;

        // Create offscreen buffer for pixel manipulation
        this.imageData = this.ctx.createImageData(engine.width, engine.height);
        this.pixels = this.imageData.data;

        // Pre-fill with background color
        this.clearBuffer();
    }

    /** Clear the pixel buffer to background */
    clearBuffer() {
        for (let i = 0; i < this.pixels.length; i += 4) {
            this.pixels[i] = 10;
            this.pixels[i + 1] = 14;
            this.pixels[i + 2] = 23;
            this.pixels[i + 3] = 255;
        }
    }

    /** Render the entire grid to canvas */
    render() {
        const grid = this.engine.grid;
        const colorVar = this.engine.colorVar;
        const lifetime = this.engine.lifetime;
        const w = this.engine.width;
        const h = this.engine.height;
        const pixels = this.pixels;
        const frameCount = this.engine.frameCount;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const gridIdx = y * w + x;
                const pixelIdx = gridIdx * 4;
                const mat = grid[gridIdx];

                if (mat === MaterialType.EMPTY) {
                    pixels[pixelIdx] = 10;
                    pixels[pixelIdx + 1] = 14;
                    pixels[pixelIdx + 2] = 23;
                    pixels[pixelIdx + 3] = 255;
                    continue;
                }

                let color;
                const v = colorVar[gridIdx];

                if (mat === MaterialType.FIRE) {
                    color = getFireColor(lifetime[gridIdx], 180, v);
                    // Flicker effect
                    const flicker = Math.sin(frameCount * 0.3 + x * 0.5 + y * 0.3) * 15;
                    color = [
                        Math.min(255, Math.max(0, color[0] + flicker)),
                        Math.min(255, Math.max(0, color[1] + flicker * 0.5)),
                        color[2],
                        color[3]
                    ];
                } else if (mat === MaterialType.LAVA) {
                    color = getMaterialColor(mat, v);
                    // Pulsing glow
                    const pulse = Math.sin(frameCount * 0.1 + x * 0.2 + y * 0.15) * 20;
                    color = [
                        Math.min(255, color[0] + pulse),
                        Math.min(255, Math.max(0, color[1] + pulse * 0.3)),
                        color[2],
                        color[3]
                    ];
                } else if (mat === MaterialType.WATER) {
                    color = getMaterialColor(mat, v);
                    // Subtle wave effect
                    const wave = Math.sin(frameCount * 0.08 + x * 0.15 + y * 0.1) * 8;
                    color = [
                        Math.min(255, Math.max(0, color[0] + wave)),
                        Math.min(255, Math.max(0, color[1] + wave)),
                        Math.min(255, Math.max(0, color[2] + wave * 0.5)),
                        color[3]
                    ];
                } else if (mat === MaterialType.ACID) {
                    color = getMaterialColor(mat, v);
                    const glow = Math.sin(frameCount * 0.15 + x * 0.3) * 12;
                    color = [
                        Math.min(255, Math.max(0, color[0] + glow)),
                        Math.min(255, Math.max(0, color[1] + glow)),
                        color[2],
                        color[3]
                    ];
                } else if (mat === MaterialType.SMOKE || mat === MaterialType.STEAM) {
                    color = getMaterialColor(mat, v);
                    // Fade based on lifetime
                    const lt = lifetime[gridIdx];
                    const maxLt = mat === MaterialType.STEAM ? 200 : 160;
                    const fade = Math.min(1, lt / maxLt);
                    color = [color[0], color[1], color[2], Math.floor(color[3] * fade)];
                } else {
                    color = getMaterialColor(mat, v);
                }

                pixels[pixelIdx] = color[0];
                pixels[pixelIdx + 1] = color[1];
                pixels[pixelIdx + 2] = color[2];
                pixels[pixelIdx + 3] = color[3];
            }
        }

        // Put pixel data to canvas
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
