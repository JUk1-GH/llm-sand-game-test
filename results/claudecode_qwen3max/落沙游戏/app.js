// 落沙模拟游戏 - 核心实现
class Particle {
    constructor(x, y, material) {
        this.x = x;
        this.y = y;
        this.material = material;
        this.life = this.getInitialLife();
        this.temperature = this.getInitialTemperature();
        this.vx = 0;
        this.vy = 0;
    }

    getInitialLife() {
        switch (this.material) {
            case 'fire': return 30;
            case 'smoke': return 50;
            default: return Infinity;
        }
    }

    getInitialTemperature() {
        switch (this.material) {
            case 'fire': return 1000;
            case 'lava': return 800;
            default: return 25;
        }
    }
}

class MaterialSystem {
    static getMaterialProperties(material) {
        const materials = {
            sand: {
                density: 10,
                state: 'solid',
                color: '#f4a460',
                canFlowSideways: true
            },
            water: {
                density: 5,
                state: 'liquid',
                color: '#4169e1',
                spreadRate: 0.3
            },
            stone: {
                density: 15,
                state: 'solid',
                color: '#696969',
                immovable: true
            },
            fire: {
                density: 1,
                state: 'gas',
                color: '#ff4500',
                life: 30,
                temperature: 1000,
                canIgnite: true
            },
            smoke: {
                density: 0.5,
                state: 'gas',
                color: '#a9a9a9',
                life: 50,
                alpha: 0.7
            },
            acid: {
                density: 6,
                state: 'liquid',
                color: '#32cd32',
                corrosive: true,
                spreadRate: 0.2
            }
        };
        return materials[material] || materials.sand;
    }

    static canReact(material1, material2) {
        // 定义材质间的反应规则
        const reactions = {
            fire: {
                water: 'extinguish',
                sand: 'extinguish',
                acid: 'neutralize'
            },
            water: {
                fire: 'extinguish'
            },
            acid: {
                stone: 'corrode',
                sand: 'dissolve'
            }
        };

        return reactions[material1]?.[material2] || null;
    }
}

class PhysicsEngine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.currentGrid = Array(height).fill().map(() => Array(width).fill(null));
        this.nextGrid = Array(height).fill().map(() => Array(width).fill(null));
        this.particlePool = [];
    }

    createParticle(x, y, material) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        if (this.currentGrid[y][x]) return null;

        let particle;
        if (this.particlePool.length > 0) {
            particle = this.particlePool.pop();
            particle.x = x;
            particle.y = y;
            particle.material = material;
            particle.life = particle.getInitialLife();
            particle.temperature = particle.getInitialTemperature();
            particle.vx = 0;
            particle.vy = 0;
        } else {
            particle = new Particle(x, y, material);
        }

        this.currentGrid[y][x] = particle;
        return particle;
    }

    removeParticle(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const particle = this.currentGrid[y][x];
        if (particle) {
            this.currentGrid[y][x] = null;
            this.particlePool.push(particle);
        }
    }

    clear() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.currentGrid[y][x]) {
                    this.particlePool.push(this.currentGrid[y][x]);
                    this.currentGrid[y][x] = null;
                }
            }
        }
    }

    update() {
        // 清空下一帧网格
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.nextGrid[y][x] = null;
            }
        }

        // 收集所有粒子并按密度排序（重的先处理）
        const particles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.currentGrid[y][x]) {
                    particles.push({ x, y, particle: this.currentGrid[y][x] });
                }
            }
        }

        particles.sort((a, b) => {
            const propA = MaterialSystem.getMaterialProperties(a.particle.material);
            const propB = MaterialSystem.getMaterialProperties(b.particle.material);
            return propB.density - propA.density;
        });

        // 处理每个粒子
        for (const { x, y, particle } of particles) {
            this.processParticle(x, y, particle);
        }

        // 交换网格
        [this.currentGrid, this.nextGrid] = [this.nextGrid, this.currentGrid];
    }

    processParticle(x, y, particle) {
        const props = MaterialSystem.getMaterialProperties(particle.material);

        // 更新生命值
        if (isFinite(particle.life)) {
            particle.life--;
            if (particle.life <= 0) {
                this.removeParticleFromNext(x, y);
                return;
            }
        }

        // 检查材质反应
        this.checkReactions(x, y, particle);

        // 根据状态处理物理行为
        switch (props.state) {
            case 'solid':
                this.handleSolid(x, y, particle, props);
                break;
            case 'liquid':
                this.handleLiquid(x, y, particle, props);
                break;
            case 'gas':
                this.handleGas(x, y, particle, props);
                break;
        }
    }

    checkReactions(x, y, particle) {
        // 检查相邻粒子的反应
        const directions = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                const neighbor = this.currentGrid[ny][nx];
                if (neighbor) {
                    const reaction = MaterialSystem.canReact(particle.material, neighbor.material);
                    if (reaction) {
                        this.handleReaction(x, y, particle, nx, ny, neighbor, reaction);
                        return; // 反应后停止处理
                    }
                }
            }
        }
    }

    handleReaction(x, y, particle, nx, ny, neighbor, reaction) {
        switch (reaction) {
            case 'extinguish':
                // 灭火：移除火和灭火物质
                this.removeParticleFromNext(x, y);
                this.removeParticleFromNext(nx, ny);
                // 可能产生烟
                if (Math.random() < 0.3) {
                    this.createParticleInNext(x, y, 'smoke');
                }
                break;
            case 'corrode':
            case 'dissolve':
                // 腐蚀：移除被腐蚀物质，酸可能消耗
                this.removeParticleFromNext(nx, ny);
                if (Math.random() < 0.1) {
                    this.removeParticleFromNext(x, y);
                }
                break;
            case 'neutralize':
                // 中和：移除两者
                this.removeParticleFromNext(x, y);
                this.removeParticleFromNext(nx, ny);
                break;
        }
    }

    handleSolid(x, y, particle, props) {
        if (props.immovable) {
            this.moveParticleToNext(x, y, particle);
            return;
        }

        // 尝试下落
        if (y + 1 < this.height && !this.nextGrid[y + 1][x]) {
            this.moveParticleToNext(x, y + 1, particle);
            return;
        }

        // 沙子可以侧向流动
        if (props.canFlowSideways) {
            const sideDirs = Math.random() < 0.5 ? [-1, 1] : [1, -1];
            for (const dx of sideDirs) {
                const nx = x + dx;
                const ny = y + 1;
                if (nx >= 0 && nx < this.width && ny < this.height) {
                    if (!this.nextGrid[ny][nx] && !this.currentGrid[ny][nx]) {
                        this.moveParticleToNext(nx, ny, particle);
                        return;
                    }
                }
            }
        }

        // 保持原位
        this.moveParticleToNext(x, y, particle);
    }

    handleLiquid(x, y, particle, props) {
        // 优先下落
        if (y + 1 < this.height) {
            if (!this.nextGrid[y + 1][x]) {
                this.moveParticleToNext(x, y + 1, particle);
                return;
            }
        }

        // 水平扩散
        const spreadChance = props.spreadRate || 0.3;
        if (Math.random() < spreadChance) {
            const sideDirs = Math.random() < 0.5 ? [-1, 1] : [1, -1];
            for (const dx of sideDirs) {
                const nx = x + dx;
                if (nx >= 0 && nx < this.width) {
                    if (!this.nextGrid[y][nx]) {
                        this.moveParticleToNext(nx, y, particle);
                        return;
                    }
                }
            }
        }

        // 如果下面有更轻的物质，可以上浮
        if (y > 0 && this.nextGrid[y - 1][x]) {
            const belowProps = MaterialSystem.getMaterialProperties(this.nextGrid[y - 1][x].material);
            if (belowProps.density < props.density) {
                // 交换位置
                const belowParticle = this.nextGrid[y - 1][x];
                this.nextGrid[y - 1][x] = particle;
                this.nextGrid[y][x] = belowParticle;
                particle.x = x;
                particle.y = y - 1;
                belowParticle.x = x;
                belowParticle.y = y;
                return;
            }
        }

        // 保持原位
        this.moveParticleToNext(x, y, particle);
    }

    handleGas(x, y, particle, props) {
        // 主要上升
        if (y > 0 && !this.nextGrid[y - 1][x]) {
            this.moveParticleToNext(x, y - 1, particle);
            return;
        }

        // 随机水平扩散
        if (Math.random() < 0.3) {
            const dx = Math.random() < 0.5 ? -1 : 1;
            const nx = x + dx;
            if (nx >= 0 && nx < this.width && !this.nextGrid[y][nx]) {
                this.moveParticleToNext(nx, y, particle);
                return;
            }
        }

        // 如果上面有更重的物质，下沉
        if (y + 1 < this.height && this.nextGrid[y + 1][x]) {
            const aboveProps = MaterialSystem.getMaterialProperties(this.nextGrid[y + 1][x].material);
            if (aboveProps.density > props.density) {
                const aboveParticle = this.nextGrid[y + 1][x];
                this.nextGrid[y + 1][x] = particle;
                this.nextGrid[y][x] = aboveParticle;
                particle.x = x;
                particle.y = y + 1;
                aboveParticle.x = x;
                aboveParticle.y = y;
                return;
            }
        }

        // 保持原位
        this.moveParticleToNext(x, y, particle);
    }

    moveParticleToNext(x, y, particle) {
        particle.x = x;
        particle.y = y;
        this.nextGrid[y][x] = particle;
    }

    createParticleInNext(x, y, material) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height && !this.nextGrid[y][x]) {
            const particle = new Particle(x, y, material);
            this.nextGrid[y][x] = particle;
            return particle;
        }
        return null;
    }

    removeParticleFromNext(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const particle = this.nextGrid[y][x];
            if (particle) {
                this.nextGrid[y][x] = null;
                this.particlePool.push(particle);
            }
        }
    }

    getParticleAt(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.currentGrid[y][x];
        }
        return null;
    }
}

class Renderer {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = width * 2;
        this.offscreenCanvas.height = height * 2;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');

        // 设置缩放以获得更好的像素效果
        canvas.style.width = (width * 2) + 'px';
        canvas.style.height = (height * 2) + 'px';
    }

    render(physicsEngine) {
        // 清空离屏画布
        this.offscreenCtx.fillStyle = '#0a0a1a';
        this.offscreenCtx.fillRect(0, 0, this.width * 2, this.height * 2);

        // 渲染所有粒子
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const particle = physicsEngine.currentGrid[y][x];
                if (particle) {
                    const props = MaterialSystem.getMaterialProperties(particle.material);
                    this.renderParticle(x, y, props);
                }
            }
        }

        // 将离屏画布绘制到主画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    renderParticle(x, y, props) {
        this.offscreenCtx.fillStyle = props.color;

        if (props.alpha !== undefined) {
            this.offscreenCtx.globalAlpha = props.alpha;
        } else {
            this.offscreenCtx.globalAlpha = 1;
        }

        // 渲染为2x2像素块
        this.offscreenCtx.fillRect(x * 2, y * 2, 2, 2);
        this.offscreenCtx.globalAlpha = 1;
    }
}

class SandGame {
    constructor() {
        this.canvas = document.getElementById('sandCanvas');
        this.width = 300; // 网格宽度
        this.height = 200; // 网格高度
        this.physicsEngine = new PhysicsEngine(this.width, this.height);
        this.renderer = new Renderer(this.canvas, this.width, this.height);
        this.isRunning = true;
        this.currentMaterial = 'sand';
        this.mouseDown = false;
        this.brushSize = 1;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupControls();
        this.gameLoop();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // 触摸支持
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
    }

    setupControls() {
        // 材质选择按钮
        const materialButtons = document.querySelectorAll('.material-btn');
        materialButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                materialButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMaterial = btn.dataset.material;
            });
        });

        // 游戏控制按钮
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.isRunning = !this.isRunning;
            document.getElementById('pauseBtn').textContent = this.isRunning ? '暂停' : '继续';
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.physicsEngine.clear();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.physicsEngine.clear();
            this.isRunning = true;
            document.getElementById('pauseBtn').textContent = '暂停';
        });
    }

    handleMouseDown(e) {
        this.mouseDown = true;
        this.placeParticles(e);
    }

    handleMouseUp(e) {
        this.mouseDown = false;
    }

    handleMouseMove(e) {
        if (this.mouseDown) {
            this.placeParticles(e);
        }
    }

    placeParticles(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX / 2);
        const y = Math.floor((e.clientY - rect.top) * scaleY / 2);

        // 左键放置粒子，右键擦除
        if (e.button === 0 || e.touches) {
            this.placeParticleAt(x, y);
        } else if (e.button === 2) {
            this.removeParticleAt(x, y);
        }
    }

    placeParticleAt(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.physicsEngine.createParticle(x, y, this.currentMaterial);
        }
    }

    removeParticleAt(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.physicsEngine.removeParticle(x, y);
        }
    }

    gameLoop() {
        if (this.isRunning) {
            this.physicsEngine.update();
        }
        this.renderer.render(this.physicsEngine);
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new SandGame();
});