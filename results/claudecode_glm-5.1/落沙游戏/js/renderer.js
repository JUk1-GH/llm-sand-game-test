// renderer.js - Canvas ImageData 渲染

const PIXEL_SCALE = 4;
const CANVAS_W = GRID_W * PIXEL_SCALE;  // 960
const CANVAS_H = GRID_H * PIXEL_SCALE;  // 720

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = CANVAS_W;
        this.canvas.height = CANVAS_H;
        this.ctx = canvas.getContext('2d');
        this.imageData = this.ctx.createImageData(CANVAS_W, CANVAS_H);
        this.data = this.imageData.data;
    }

    render(sim) {
        const data = this.data;
        const grid = sim.grid;

        for (let gy = 0; gy < GRID_H; gy++) {
            for (let gx = 0; gx < GRID_W; gx++) {
                const mat = grid[gy * GRID_W + gx];
                const color = getColor(mat, gx, gy);
                const r = color[0];
                const g = color[1];
                const b = color[2];

                // 填充 PIXEL_SCALE × PIXEL_SCALE 像素块
                const baseX = gx * PIXEL_SCALE;
                const baseY = gy * PIXEL_SCALE;
                for (let py = 0; py < PIXEL_SCALE; py++) {
                    const rowOffset = (baseY + py) * CANVAS_W;
                    for (let px = 0; px < PIXEL_SCALE; px++) {
                        const idx = (rowOffset + baseX + px) << 2;
                        data[idx]     = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                        data[idx + 3] = 255;
                    }
                }
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
