/**
 * Falling Sand Simulator — Application Controller
 * Handles UI, input, and game loop
 */

(function () {
    'use strict';

    // ─── Configuration ───────────────────────────────────────
    const GRID_WIDTH = 300;
    const GRID_HEIGHT = 200;
    const PIXEL_SCALE = 3; // Each cell = 3x3 CSS pixels

    // ─── State ───────────────────────────────────────────────
    let engine, renderer;
    let running = true;
    let selectedMaterial = MaterialType.SAND;
    let brushSize = 3;
    let simSpeed = 3;
    let mouseDown = false;
    let mouseButton = 0;
    let lastMouseX = -1, lastMouseY = -1;
    let hasDrawn = false;

    // FPS tracking
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let currentFps = 60;

    // ─── DOM References ──────────────────────────────────────
    const canvas = document.getElementById('sand-canvas');
    const fpsValue = document.getElementById('fps-value');
    const particleValue = document.getElementById('particle-count-value');
    const brushSizeSlider = document.getElementById('brush-size');
    const brushSizeLabel = document.getElementById('brush-size-label');
    const brushPreview = document.getElementById('brush-preview');
    const simSpeedSlider = document.getElementById('sim-speed');
    const speedLabel = document.getElementById('speed-label');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnStep = document.getElementById('btn-step');
    const btnClear = document.getElementById('btn-clear');
    const materialGrid = document.getElementById('material-grid');
    const canvasOverlay = document.getElementById('canvas-overlay');
    const tooltip = document.getElementById('material-tooltip');

    // ─── Initialize ──────────────────────────────────────────
    function init() {
        // Setup canvas
        canvas.width = GRID_WIDTH;
        canvas.height = GRID_HEIGHT;
        canvas.style.width = (GRID_WIDTH * PIXEL_SCALE) + 'px';
        canvas.style.height = (GRID_HEIGHT * PIXEL_SCALE) + 'px';

        // Create engine and renderer
        engine = new SandEngine(GRID_WIDTH, GRID_HEIGHT);
        renderer = new SandRenderer(canvas, engine);

        // Build UI
        buildMaterialGrid();
        updateBrushPreview();
        updatePlayPauseButton();

        // Bind events
        bindCanvasEvents();
        bindControlEvents();
        bindKeyboardEvents();

        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    // ─── Material Grid UI ────────────────────────────────────
    function buildMaterialGrid() {
        materialGrid.innerHTML = '';

        MATERIAL_UI_ORDER.forEach(matId => {
            const mat = Materials[matId];
            const btn = document.createElement('button');
            btn.className = 'material-btn' + (matId === selectedMaterial ? ' active' : '');
            btn.dataset.material = matId;
            btn.id = `mat-btn-${mat.name}`;

            // Swatch
            const swatch = document.createElement('div');
            swatch.className = `material-swatch swatch-${mat.name}`;
            if (['fire', 'lava', 'acid'].includes(mat.name)) {
                swatch.classList.add('animated');
            }
            btn.appendChild(swatch);

            // Name
            const name = document.createElement('span');
            name.className = 'material-name';
            name.textContent = mat.label;
            if (mat.shortcut) {
                name.textContent += ` [${mat.shortcut}]`;
            }
            btn.appendChild(name);

            // Click handler
            btn.addEventListener('click', () => selectMaterial(matId));

            // Tooltip
            btn.addEventListener('mouseenter', (e) => showTooltip(e, mat));
            btn.addEventListener('mouseleave', hideTooltip);
            btn.addEventListener('mousemove', moveTooltip);

            materialGrid.appendChild(btn);
        });
    }

    function selectMaterial(matId) {
        selectedMaterial = matId;

        // Update active state
        document.querySelectorAll('.material-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.material) === matId);
        });

        updateBrushPreview();
    }

    // ─── Tooltip ─────────────────────────────────────────────
    function showTooltip(e, mat) {
        tooltip.querySelector('.tooltip-name').textContent = mat.label;
        tooltip.querySelector('.tooltip-desc').textContent = mat.desc;
        tooltip.querySelector('.tooltip-props').textContent = mat.props || '';
        tooltip.classList.remove('hidden');
        moveTooltip(e);
    }

    function moveTooltip(e) {
        const x = e.clientX + 12;
        const y = e.clientY + 12;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }

    // ─── Brush Preview ───────────────────────────────────────
    function updateBrushPreview() {
        const size = Math.min(brushSize * 3, 28);
        const mat = Materials[selectedMaterial];
        const swatchClass = `swatch-${mat.name}`;

        brushPreview.innerHTML = '';
        const dot = document.createElement('div');
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.borderRadius = '50%';
        dot.className = swatchClass;
        dot.style.position = 'absolute';
        dot.style.top = '50%';
        dot.style.left = '50%';
        dot.style.transform = 'translate(-50%, -50%)';
        brushPreview.appendChild(dot);
    }

    // ─── Canvas Events ───────────────────────────────────────
    function bindCanvasEvents() {
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            mouseDown = true;
            mouseButton = e.button;
            const pos = canvasToGrid(e);
            lastMouseX = pos.x;
            lastMouseY = pos.y;
            draw(pos.x, pos.y);
            hideOverlay();
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            const pos = canvasToGrid(e);
            // Interpolate between last and current position for smooth drawing
            drawLine(lastMouseX, lastMouseY, pos.x, pos.y);
            lastMouseX = pos.x;
            lastMouseY = pos.y;
        });

        window.addEventListener('mouseup', () => {
            mouseDown = false;
            lastMouseX = -1;
            lastMouseY = -1;
        });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            mouseDown = true;
            const pos = canvasToGridTouch(e);
            lastMouseX = pos.x;
            lastMouseY = pos.y;
            draw(pos.x, pos.y);
            hideOverlay();
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!mouseDown) return;
            const pos = canvasToGridTouch(e);
            drawLine(lastMouseX, lastMouseY, pos.x, pos.y);
            lastMouseX = pos.x;
            lastMouseY = pos.y;
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            mouseDown = false;
            lastMouseX = -1;
            lastMouseY = -1;
        });

        // Prevent context menu
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    function canvasToGrid(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = GRID_WIDTH / rect.width;
        const scaleY = GRID_HEIGHT / rect.height;
        return {
            x: Math.floor((e.clientX - rect.left) * scaleX),
            y: Math.floor((e.clientY - rect.top) * scaleY),
        };
    }

    function canvasToGridTouch(e) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = GRID_WIDTH / rect.width;
        const scaleY = GRID_HEIGHT / rect.height;
        return {
            x: Math.floor((touch.clientX - rect.left) * scaleX),
            y: Math.floor((touch.clientY - rect.top) * scaleY),
        };
    }

    /** Draw at a grid position with current brush */
    function draw(gx, gy) {
        const mat = mouseButton === 2 ? MaterialType.EMPTY :
            (selectedMaterial === ERASER_ID ? MaterialType.EMPTY : selectedMaterial);
        const radius = brushSize;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx * dx + dy * dy > radius * radius) continue;
                const nx = gx + dx, ny = gy + dy;
                if (!engine.inBounds(nx, ny)) continue;

                if (mat === MaterialType.EMPTY) {
                    engine.set(nx, ny, MaterialType.EMPTY);
                } else {
                    // Only place on empty cells (or with some randomness for density)
                    if (engine.isEmpty(nx, ny) || Math.random() < 0.3) {
                        engine.set(nx, ny, mat);
                    }
                }
            }
        }
    }

    /** Bresenham line for smooth drawing */
    function drawLine(x0, y0, x1, y1) {
        if (x0 < 0 || y0 < 0) {
            draw(x1, y1);
            return;
        }
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            draw(x0, y0);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    // ─── Control Events ──────────────────────────────────────
    function bindControlEvents() {
        btnPlayPause.addEventListener('click', togglePlayPause);
        btnStep.addEventListener('click', singleStep);
        btnClear.addEventListener('click', clearCanvas);

        brushSizeSlider.addEventListener('input', () => {
            brushSize = parseInt(brushSizeSlider.value);
            brushSizeLabel.textContent = brushSize;
            updateBrushPreview();
        });

        simSpeedSlider.addEventListener('input', () => {
            simSpeed = parseInt(simSpeedSlider.value);
            speedLabel.textContent = simSpeed + 'x';
        });
    }

    function togglePlayPause() {
        running = !running;
        updatePlayPauseButton();
    }

    function updatePlayPauseButton() {
        if (running) {
            btnPlayPause.querySelector('.btn-icon').textContent = '⏸';
            btnPlayPause.querySelector('.btn-text').textContent = '暂停';
            btnPlayPause.classList.add('running');
        } else {
            btnPlayPause.querySelector('.btn-icon').textContent = '▶';
            btnPlayPause.querySelector('.btn-text').textContent = '播放';
            btnPlayPause.classList.remove('running');
        }
    }

    function singleStep() {
        if (running) {
            running = false;
            updatePlayPauseButton();
        }
        engine.step();
        renderer.render();
    }

    function clearCanvas() {
        engine.clear();
        renderer.render();
        // Add brief flash animation
        canvas.style.transition = 'filter 0.3s ease';
        canvas.style.filter = 'brightness(2)';
        setTimeout(() => {
            canvas.style.filter = 'brightness(1)';
            setTimeout(() => canvas.style.transition = '', 300);
        }, 150);
    }

    // ─── Keyboard Shortcuts ──────────────────────────────────
    function bindKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            // Don't handle if user is typing in an input
            if (e.target.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'c':
                    clearCanvas();
                    break;
                case 's':
                    singleStep();
                    break;
                case 'e':
                    selectMaterial(ERASER_ID);
                    break;
                case '[':
                    brushSize = Math.max(1, brushSize - 1);
                    brushSizeSlider.value = brushSize;
                    brushSizeLabel.textContent = brushSize;
                    updateBrushPreview();
                    break;
                case ']':
                    brushSize = Math.min(15, brushSize + 1);
                    brushSizeSlider.value = brushSize;
                    brushSizeLabel.textContent = brushSize;
                    updateBrushPreview();
                    break;
                case '1': selectMaterial(MaterialType.SAND); break;
                case '2': selectMaterial(MaterialType.WATER); break;
                case '3': selectMaterial(MaterialType.STONE); break;
                case '4': selectMaterial(MaterialType.FIRE); break;
                case '5': selectMaterial(MaterialType.SMOKE); break;
                case '6': selectMaterial(MaterialType.OIL); break;
                case '7': selectMaterial(MaterialType.LAVA); break;
                case '8': selectMaterial(MaterialType.PLANT); break;
                case '9': selectMaterial(MaterialType.ACID); break;
                case '0': selectMaterial(MaterialType.STEAM); break;
            }
        });
    }

    // ─── Overlay ─────────────────────────────────────────────
    function hideOverlay() {
        if (!hasDrawn) {
            hasDrawn = true;
            canvasOverlay.classList.add('hidden');
        }
    }

    // ─── Game Loop ───────────────────────────────────────────
    function gameLoop(timestamp) {
        // FPS calculation
        frameCount++;
        const elapsed = timestamp - lastFpsTime;
        if (elapsed >= 1000) {
            currentFps = Math.round(frameCount * 1000 / elapsed);
            fpsValue.textContent = currentFps;
            frameCount = 0;
            lastFpsTime = timestamp;
        }

        // Simulation steps
        if (running) {
            for (let s = 0; s < simSpeed; s++) {
                engine.step();
            }
        }

        // Render
        renderer.render();

        // Update particle count display
        particleValue.textContent = engine.particleCount.toLocaleString();

        requestAnimationFrame(gameLoop);
    }

    // ─── Start ───────────────────────────────────────────────
    init();
})();
