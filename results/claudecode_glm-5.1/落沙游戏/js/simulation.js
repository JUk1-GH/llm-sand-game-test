// simulation.js - 核心模拟引擎（网格 + 更新调度）

const GRID_W = 240;
const GRID_H = 180;

class Simulation {
    constructor() {
        const size = GRID_W * GRID_H;
        this.grid = new Uint8Array(size);       // 材料ID
        this.life = new Int16Array(size);        // 生命值（用于气体消散）
        this.clock = new Uint32Array(size);      // 帧标记（clock优化）
        this.frameCount = 0;
        this.pendingExplosions = [];             // 爆炸队列（分帧处理）
    }

    // 基础操作
    idx(x, y) {
        return y * GRID_W + x;
    }

    inBounds(x, y) {
        return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
    }

    get(x, y) {
        if (!this.inBounds(x, y)) return -1;
        return this.grid[this.idx(x, y)];
    }

    isEmpty(x, y) {
        return this.get(x, y) === Materials.EMPTY;
    }

    set(x, y, materialId, life) {
        if (!this.inBounds(x, y)) return;
        const i = this.idx(x, y);
        this.grid[i] = materialId;
        this.life[i] = life || 0;
        this.clock[i] = this.frameCount;
    }

    swap(x1, y1, x2, y2) {
        if (!this.inBounds(x1, y1) || !this.inBounds(x2, y2)) return;
        const i1 = this.idx(x1, y1);
        const i2 = this.idx(x2, y2);
        const tmpGrid = this.grid[i1];
        const tmpLife = this.life[i1];
        this.grid[i1] = this.grid[i2];
        this.life[i1] = this.life[i2];
        this.grid[i2] = tmpGrid;
        this.life[i2] = tmpLife;
        this.clock[i1] = this.frameCount;
        this.clock[i2] = this.frameCount;
    }

    clear(x, y) {
        this.set(x, y, Materials.EMPTY, 0);
    }

    // 判断是否已被本帧更新过
    isUpdated(x, y) {
        if (!this.inBounds(x, y)) return true;
        return this.clock[this.idx(x, y)] === this.frameCount;
    }

    // 主更新
    update() {
        this.frameCount++;
        // 双向交替扫描消除方向偏移
        const startY = (this.frameCount & 1) ? GRID_H - 1 : 0;
        const endY = (this.frameCount & 1) ? -1 : GRID_H;
        const stepY = (this.frameCount & 1) ? -1 : 1;

        for (let y = startY; y !== endY; y += stepY) {
            // 水平方向也交替
            const startX = (y & 1) ? GRID_W - 1 : 0;
            const endX = (y & 1) ? -1 : GRID_W;
            const stepX = (y & 1) ? -1 : 1;

            for (let x = startX; x !== endX; x += stepX) {
                if (this.isUpdated(x, y)) continue;
                const mat = this.get(x, y);
                if (mat === Materials.EMPTY) continue;
                updatePhysics(this, x, y, mat);
            }
        }

        // 处理爆炸队列
        this.processExplosions();
    }

    // 爆炸队列处理（链式反应分帧）
    processExplosions() {
        const maxPerFrame = 200;
        let processed = 0;
        while (this.pendingExplosions.length > 0 && processed < maxPerFrame) {
            const [ex, ey, radius] = this.pendingExplosions.shift();
            this.explode(ex, ey, radius);
            processed++;
        }
    }

    // 执行爆炸
    explode(cx, cy, radius) {
        const r2 = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist2 = dx * dx + dy * dy;
                if (dist2 > r2) continue;
                const nx = cx + dx;
                const ny = cy + dy;
                if (!this.inBounds(nx, ny)) continue;
                const mat = this.get(nx, ny);
                if (mat === Materials.EMPTY) continue;
                const props = MaterialProps[mat];
                if (!props) continue;
                if (mat === Materials.GUNPOWDER) {
                    this.pendingExplosions.push([nx, ny, 5]);
                    this.clear(nx, ny);
                } else if (props.flammable) {
                    this.set(nx, ny, Materials.FIRE, MaterialProps[Materials.FIRE].maxLife);
                } else if (dist2 < r2 * 0.4) {
                    // 内圈破坏
                    this.clear(nx, ny);
                }
            }
        }
        // 中心产生火和烟
        if (this.inBounds(cx, cy)) {
            this.set(cx, cy, Materials.FIRE, MaterialProps[Materials.FIRE].maxLife);
        }
    }

    // 圆形笔刷放置
    place(cx, cy, materialId, radius) {
        if (materialId === Materials.EMPTY) {
            // 橡皮擦
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy > radius * radius) continue;
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (!this.inBounds(nx, ny)) continue;
                    this.clear(nx, ny);
                }
            }
            return;
        }

        const props = MaterialProps[materialId];
        if (!props) return;
        const life = props.maxLife || 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy > radius * radius) continue;
                const nx = cx + dx;
                const ny = cy + dy;
                if (!this.inBounds(nx, ny)) continue;
                if (!this.isEmpty(nx, ny)) continue;
                // 随机稀疏度让放置看起来更自然
                if (Math.random() < 0.7) {
                    this.set(nx, ny, materialId, life);
                }
            }
        }
    }

    // 清空整个网格
    clearAll() {
        this.grid.fill(0);
        this.life.fill(0);
        this.clock.fill(0);
        this.pendingExplosions = [];
    }
}
