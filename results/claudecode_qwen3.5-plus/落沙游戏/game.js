// 落沙模拟游戏 - 主逻辑

// Matter.js 模块别名
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      Events = Matter.Events;

// 游戏状态
const gameState = {
    currentMaterial: 'sand',
    particleSize: 'medium',
    density: 1,
    friction: 0.3,
    restitution: 0.1,
    isContinuousMode: false,
    isMouseDown: false,
    sandCount: 0,
    fps: 0
};

// 物理引擎实例
let engine = null;
let render = null;
let runner = null;
let canvas = null;
let ctx = null;

// 边界容器尺寸
const boundaryWidth = 800;
const boundaryHeight = 600;
const wallThickness = 50;

// 初始化
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 设置 canvas 尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 创建引擎
    engine = Engine.create();
    engine.world.gravity.y = 1;

    // 创建边界
    createBoundaries();

    // 设置渲染器
    setupRenderer();

    // 设置交互
    setupInteraction();

    // 设置控制面板
    setupControls();

    // 启动引擎
    startEngine();

    // 启动 FPS 计数器
    startFPSCounter();
}

// 调整 canvas 尺寸
function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    const rect = container.getBoundingClientRect();

    // 设置实际 canvas 尺寸（高分辨率）
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// 创建边界容器
function createBoundaries() {
    const options = {
        isStatic: true,
        render: { visible: false },
        friction: 0.5,
        restitution: 0.2
    };

    const walls = [
        // 底部
        Bodies.rectangle(
            boundaryWidth / 2,
            boundaryHeight + wallThickness / 2 - 50,
            boundaryWidth,
            wallThickness,
            options
        ),
        // 左侧
        Bodies.rectangle(
            wallThickness / 2,
            boundaryHeight / 2 - 50,
            wallThickness,
            boundaryHeight,
            options
        ),
        // 右侧
        Bodies.rectangle(
            boundaryWidth + wallThickness / 2,
            boundaryHeight / 2 - 50,
            wallThickness,
            boundaryHeight,
            options
        )
    ];

    Composite.add(engine.world, walls);
}

// 设置自定义渲染器
function setupRenderer() {
    render = {
        canvas: canvas,
        ctx: ctx,
        bounds: { min: { x: 0, y: 0 }, max: { x: boundaryWidth, y: boundaryHeight } }
    };
}

// 启动引擎
function startEngine() {
    runner = Runner.create();
    Runner.run(runner, engine);

    // 自定义渲染循环
    (function renderLoop() {
        renderScene();
        requestAnimationFrame(renderLoop);
    })();
}

// 渲染场景
function renderScene() {
    const bodies = Composite.allBodies(engine.world);

    // 清空画布
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 计算缩放比例
    const scaleX = canvas.width / boundaryWidth;
    const scaleY = canvas.height / boundaryHeight;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 渲染每个刚体
    bodies.forEach(body => {
        if (body.isStatic) {
            // 渲染边界
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;

            if (body.circleRadius) {
                ctx.beginPath();
                ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(
                    body.bounds.min.x,
                    body.bounds.min.y,
                    body.bounds.max.x - body.bounds.min.x,
                    body.bounds.max.y - body.bounds.min.y
                );
                ctx.strokeRect(
                    body.bounds.min.x,
                    body.bounds.min.y,
                    body.bounds.max.x - body.bounds.min.x,
                    body.bounds.max.y - body.bounds.min.y
                );
            }
        } else {
            // 渲染沙粒
            renderParticle(body);
        }
    });

    ctx.restore();
}

// 渲染单个颗粒
function renderParticle(body) {
    ctx.beginPath();
    ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);

    const material = body.customMaterial || Materials.sand;

    if (material.transparent) {
        ctx.fillStyle = material.color;
        ctx.fill();
        ctx.strokeStyle = material.color.replace('rgba', 'rgb').replace('0.', '0.3');
        ctx.lineWidth = 1;
        ctx.stroke();
    } else {
        // 创建渐变效果
        const gradient = ctx.createRadialGradient(
            body.position.x - body.circleRadius * 0.3,
            body.position.y - body.circleRadius * 0.3,
            body.circleRadius * 0.2,
            body.position.x,
            body.position.y,
            body.circleRadius
        );
        gradient.addColorStop(0, lightenColor(material.color, 30));
        gradient.addColorStop(1, material.color);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // 发光效果（特殊材质）
    if (material.glow) {
        ctx.shadowColor = material.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// 设置交互
function setupInteraction() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // 触摸支持
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleMouseUp);
}

// 获取鼠标位置
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // 转换为物理世界坐标
    const worldX = (canvasX / canvas.width) * boundaryWidth;
    const worldY = (canvasY / canvas.height) * boundaryHeight;

    return { x: worldX, y: worldY };
}

// 鼠标按下
function handleMouseDown(e) {
    gameState.isMouseDown = true;
    addSand(e);
}

// 鼠标移动
function handleMouseMove(e) {
    if (gameState.isMouseDown && gameState.isContinuousMode) {
        addSand(e);
    }
}

// 鼠标释放
function handleMouseUp() {
    gameState.isMouseDown = false;
}

// 触摸开始
function handleTouchStart(e) {
    e.preventDefault();
    gameState.isMouseDown = true;
    const touch = e.touches[0];
    addSand({ clientX: touch.clientX, clientY: touch.clientY });
}

// 触摸移动
function handleTouchMove(e) {
    e.preventDefault();
    if (gameState.isMouseDown && gameState.isContinuousMode) {
        const touch = e.touches[0];
        addSand({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

// 添加沙粒
function addSand(e) {
    const pos = getMousePos(e);

    // 获取当前材质和参数
    const material = Materials[gameState.currentMaterial];
    const size = ParticleSizes[gameState.particleSize];

    // 应用滑块参数
    const density = material.density * gameState.density;
    const friction = Math.max(0, Math.min(1, material.friction + (gameState.friction - 0.3)));
    const restitution = Math.max(0, Math.min(1, material.restitution + (gameState.restitution - 0.1)));

    // 创建沙粒
    const sand = Bodies.circle(pos.x, pos.y, size.radius, {
        density: density,
        friction: friction,
        restitution: restitution,
        render: {
            fillStyle: material.color
        },
        customMaterial: material
    });

    // 限制最大沙粒数量
    const maxSand = 3000;
    const bodies = Composite.allBodies(engine.world);
    const sandBodies = bodies.filter(b => !b.isStatic);

    if (sandBodies.length >= maxSand) {
        // 移除最老的沙粒
        Composite.remove(engine.world, sandBodies[0]);
        gameState.sandCount--;
    }

    Composite.add(engine.world, sand);
    gameState.sandCount++;

    updateStats();
}

// 设置控制面板
function setupControls() {
    // 材质选择
    setupMaterialButtons();

    // 颗粒大小滑块
    const sizeSlider = document.getElementById('sizeSlider');
    sizeSlider.addEventListener('input', (e) => {
        const sizes = ['small', 'medium', 'large'];
        gameState.particleSize = sizes[parseInt(e.target.value) - 1];
    });

    // 密度滑块
    const densitySlider = document.getElementById('densitySlider');
    const densityValue = document.getElementById('densityValue');
    densitySlider.addEventListener('input', (e) => {
        gameState.density = parseFloat(e.target.value);
        densityValue.textContent = gameState.density.toFixed(1);
    });

    // 摩擦力滑块
    const frictionSlider = document.getElementById('frictionSlider');
    const frictionValue = document.getElementById('frictionValue');
    frictionSlider.addEventListener('input', (e) => {
        gameState.friction = parseFloat(e.target.value);
        frictionValue.textContent = gameState.friction.toFixed(2);
    });

    // 弹性滑块
    const restitutionSlider = document.getElementById('restitutionSlider');
    const restitutionValue = document.getElementById('restitutionValue');
    restitutionSlider.addEventListener('input', (e) => {
        gameState.restitution = parseFloat(e.target.value);
        restitutionValue.textContent = gameState.restitution.toFixed(2);
    });

    // 清空按钮
    document.getElementById('clearBtn').addEventListener('click', clearSand);

    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);

    // 放置模式
    document.getElementById('singleBtn').addEventListener('click', () => setMode('single'));
    document.getElementById('continuousBtn').addEventListener('click', () => setMode('continuous'));
}

// 设置材质按钮
function setupMaterialButtons() {
    const grid = document.getElementById('materialGrid');

    Object.entries(MaterialCategories).forEach(([categoryKey, category]) => {
        // 添加分类标题
        const categoryHeader = document.createElement('div');
        categoryHeader.style.cssText = 'grid-column: span 3; font-size: 11px; color: #666; margin-top: 8px;';
        categoryHeader.textContent = category.name;
        grid.appendChild(categoryHeader);

        // 添加材质按钮
        category.materials.forEach(materialKey => {
            const material = Materials[materialKey];
            const btn = document.createElement('div');
            btn.className = 'material-btn';
            btn.style.background = material.color;
            btn.textContent = material.name;

            if (materialKey === gameState.currentMaterial) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                // 移除所有激活状态
                document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                gameState.currentMaterial = materialKey;
            });

            grid.appendChild(btn);
        });
    });
}

// 设置放置模式
function setMode(mode) {
    gameState.isContinuousMode = mode === 'continuous';

    document.getElementById('singleBtn').classList.toggle('active', mode === 'single');
    document.getElementById('continuousBtn').classList.toggle('active', mode === 'continuous');
}

// 清空沙粒
function clearSand() {
    const bodies = Composite.allBodies(engine.world);
    const sandBodies = bodies.filter(b => !b.isStatic);
    Composite.remove(engine.world, sandBodies);
    gameState.sandCount = 0;
    updateStats();
}

// 重置模拟
function resetSimulation() {
    clearSand();
    gameState.density = 1;
    gameState.friction = 0.3;
    gameState.restitution = 0.1;
    gameState.particleSize = 'medium';
    gameState.currentMaterial = 'sand';

    // 重置滑块
    document.getElementById('densitySlider').value = 1;
    document.getElementById('frictionSlider').value = 0.3;
    document.getElementById('restitutionSlider').value = 0.1;
    document.getElementById('sizeSlider').value = 2;

    // 更新显示值
    document.getElementById('densityValue').textContent = '1.0';
    document.getElementById('frictionValue').textContent = '0.30';
    document.getElementById('restitutionValue').textContent = '0.10';

    // 重置材质按钮
    setupMaterialButtons();
}

// 更新统计信息
function updateStats() {
    document.getElementById('sandCount').textContent = `沙粒数：${gameState.sandCount}`;
}

// FPS 计数器
function startFPSCounter() {
    let lastTime = performance.now();
    let frameCount = 0;

    function updateFPS() {
        const currentTime = performance.now();
        frameCount++;

        if (currentTime - lastTime >= 1000) {
            gameState.fps = frameCount;
            document.getElementById('fpsDisplay').textContent = `FPS: ${gameState.fps}`;
            frameCount = 0;
            lastTime = currentTime;
        }

        requestAnimationFrame(updateFPS);
    }

    updateFPS();
}

// 颜色变亮工具函数
function lightenColor(color, percent) {
    // 处理十六进制颜色
    if (color.startsWith('#')) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + percent);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
        const b = Math.min(255, (num & 0x0000FF) + percent);
        return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
