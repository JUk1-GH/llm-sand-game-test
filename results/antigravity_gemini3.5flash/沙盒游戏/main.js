import { SandEngine } from './engine.js';
import { MATERIAL_IDS, MATERIALS } from './materials.js';
import { LEVELS } from './levels.js';

document.addEventListener('DOMContentLoaded', () => {
    // Canvas Setup
    const canvas = document.getElementById('sand-canvas');
    const ctx = canvas.getContext('2d');
    
    // Internal simulation resolution (scaled up via CSS image-rendering)
    const simWidth = 240;
    const simHeight = 160;
    canvas.width = simWidth;
    canvas.height = simHeight;
    
    const imageData = ctx.createImageData(simWidth, simHeight);
    
    // Instantiate Engine
    const engine = new SandEngine(simWidth, simHeight);
    
    // App State
    let selectedMaterialId = MATERIAL_IDS.SAND;
    let brushSize = 5;
    let isPlaying = true;
    let simSpeed = 1; // Number of steps per frame
    let currentLevelId = 0; // 0 = Sandbox
    let levelWon = false;

    // Painting state
    let isPainting = false;
    let lastPaintX = null;
    let lastPaintY = null;
    
    // Performance metrics
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;
    
    // UI Elements
    const fpsVal = document.getElementById('fps-val');
    const activeChunksVal = document.getElementById('active-chunks-val');
    const particlesVal = document.getElementById('particles-val');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const stepBtn = document.getElementById('step-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resetLevelBtn = document.getElementById('reset-level-btn');
    const brushSizeSlider = document.getElementById('brush-size-slider');
    const brushSizeVal = document.getElementById('brush-size-val');
    const simSpeedSlider = document.getElementById('sim-speed-slider');
    const simSpeedVal = document.getElementById('sim-speed-val');
    
    const levelSelect = document.getElementById('level-select');
    const levelObjectivePanel = document.getElementById('level-objective-panel');
    const levelStatus = document.getElementById('level-status');
    const levelDesc = document.getElementById('level-desc');
    const levelProgressMsg = document.getElementById('level-progress-msg');
    
    const materialsGrid = document.getElementById('materials-grid');
    const categoryTabs = document.querySelectorAll('.tab-btn');
    
    const infoName = document.getElementById('info-name');
    const infoType = document.getElementById('info-type');
    const infoDesc = document.getElementById('info-desc');
    
    const windSlider = document.getElementById('wind-slider');
    const windVal = document.getElementById('wind-val');
    const gravityBtns = document.querySelectorAll('.btn-gravity');
    
    const victoryOverlay = document.getElementById('victory-overlay');
    const victoryMsg = document.getElementById('victory-msg');
    const nextLevelBtn = document.getElementById('next-level-btn');
    
    const helpToggle = document.getElementById('help-toggle');
    const helpModal = document.getElementById('help-modal');
    const modalClose = document.querySelector('.modal-close');

    // -------------------------------------------------------------
    // UI BUILDERS
    // -------------------------------------------------------------
    
    // Populate Level Select
    function initLevelSelect() {
        levelSelect.innerHTML = '';
        LEVELS.forEach(level => {
            const opt = document.createElement('option');
            opt.value = level.id;
            opt.textContent = level.name;
            levelSelect.appendChild(opt);
        });
    }

    // Populate Material Grid
    function buildMaterialsGrid() {
        materialsGrid.innerHTML = '';
        
        // Group by category later, but create all buttons first
        Object.values(MATERIALS).forEach(mat => {
            if (mat.id === MATERIAL_IDS.AIR) return; // Skip air from standard palette, use eraser instead
            
            const btn = document.createElement('button');
            btn.className = 'mat-btn';
            btn.dataset.id = mat.id;
            btn.dataset.category = mat.category;
            
            // Colordot indicator
            const dot = document.createElement('span');
            dot.className = 'mat-color-dot';
            dot.style.backgroundColor = `rgba(${mat.color[0]}, ${mat.color[1]}, ${mat.color[2]}, ${mat.color[3] !== undefined ? mat.color[3]/255 : 1})`;
            
            // Name label
            const label = document.createElement('span');
            label.className = 'mat-name';
            label.textContent = mat.name;
            
            btn.appendChild(dot);
            btn.appendChild(label);
            
            // Hover: Show description in Info Card
            btn.addEventListener('mouseenter', () => showMaterialInfo(mat.id));
            
            // Click: Select material
            btn.addEventListener('click', () => {
                if (btn.classList.contains('locked')) return;
                selectMaterial(mat.id);
            });
            
            materialsGrid.appendChild(btn);
        });

        // Add Eraser explicitly as a material (AIR)
        const eraserBtn = document.createElement('button');
        eraserBtn.className = 'mat-btn';
        eraserBtn.dataset.id = MATERIAL_IDS.AIR;
        eraserBtn.dataset.category = 'special';
        
        const dot = document.createElement('span');
        dot.className = 'mat-color-dot';
        dot.style.backgroundColor = 'transparent';
        dot.style.border = '2px dashed rgba(255,255,255,0.4)';
        
        const label = document.createElement('span');
        label.className = 'mat-name';
        label.textContent = '橡皮擦';
        
        eraserBtn.appendChild(dot);
        eraserBtn.appendChild(label);
        eraserBtn.addEventListener('mouseenter', () => showMaterialInfo(MATERIAL_IDS.AIR));
        eraserBtn.addEventListener('click', () => selectMaterial(MATERIAL_IDS.AIR));
        
        materialsGrid.appendChild(eraserBtn);
    }

    function showMaterialInfo(id) {
        const mat = MATERIALS[id];
        if (!mat) return;
        
        infoName.textContent = mat.name;
        
        // Translate state to readable category tag
        let typeStr = mat.state;
        if (mat.state === 'empty') typeStr = 'Erase';
        else if (mat.state === 'solid') typeStr = 'Solid';
        else if (mat.state === 'powder') typeStr = 'Powder';
        else if (mat.state === 'liquid') typeStr = 'Liquid';
        else if (mat.state === 'gas') typeStr = 'Gas';
        else if (mat.state === 'fire') typeStr = 'Thermal';
        else if (id === MATERIAL_IDS.CONCRETE) typeStr = 'Heavy';
        
        infoType.textContent = typeStr;
        infoDesc.textContent = mat.description;
    }

    function selectMaterial(id) {
        selectedMaterialId = id;
        
        // Remove select class from all
        document.querySelectorAll('.mat-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.id) === id) {
                btn.classList.add('selected');
            }
        });
        
        showMaterialInfo(id);
    }

    // Filter materials by tab category
    function filterPalette(category) {
        document.querySelectorAll('.mat-btn').forEach(btn => {
            const matId = parseInt(btn.dataset.id);
            const isAllowed = LEVELS[currentLevelId].allowedMaterials.includes(matId) || matId === MATERIAL_IDS.AIR;
            
            if (category === 'all' || btn.dataset.category === category || btn.dataset.id == MATERIAL_IDS.AIR) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
            
            // Mark locked if not allowed in level
            if (isAllowed) {
                btn.classList.remove('locked');
            } else {
                btn.classList.add('locked');
            }
        });
    }

    // Apply level limits to material selections
    function applyLevelConstraints(level) {
        document.querySelectorAll('.mat-btn').forEach(btn => {
            const matId = parseInt(btn.dataset.id);
            const isAllowed = level.allowedMaterials.includes(matId) || matId === MATERIAL_IDS.AIR;
            
            if (isAllowed) {
                btn.classList.remove('locked');
            } else {
                btn.classList.add('locked');
            }
        });
        
        // If current selection is locked, force select an allowed material or Eraser
        if (!level.allowedMaterials.includes(selectedMaterialId) && selectedMaterialId !== MATERIAL_IDS.AIR) {
            const firstAllowed = level.allowedMaterials.find(id => id !== MATERIAL_IDS.AIR) || MATERIAL_IDS.AIR;
            selectMaterial(firstAllowed);
        }
    }

    // -------------------------------------------------------------
    // LEVEL CONTROLLER
    // -------------------------------------------------------------
    function loadLevel(id) {
        currentLevelId = id;
        const level = LEVELS[id];
        levelWon = false;
        
        // Toggle UI overlays
        victoryOverlay.classList.add('hidden');
        
        if (id === 0) {
            // Sandbox Mode
            levelObjectivePanel.classList.add('hidden');
            resetLevelBtn.classList.add('hidden');
        } else {
            // Challenge Levels
            levelObjectivePanel.classList.remove('hidden');
            resetLevelBtn.classList.remove('hidden');
            
            levelStatus.textContent = '进行中';
            levelStatus.className = 'level-status-idle';
            levelDesc.textContent = level.description;
            levelProgressMsg.textContent = '初始化中...';
        }
        
        // Initialize engine layout
        level.init(engine);
        applyLevelConstraints(level);
        filterPalette(document.querySelector('.category-tabs .active').dataset.category);
        
        // Reset gravity button active state
        engine.gravity = 'down';
        gravityBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.gravity === 'down');
        });
        
        isPlaying = true;
        updatePlayPauseUI();
    }

    function checkLevelProgress() {
        if (currentLevelId === 0 || levelWon) return;
        
        const level = LEVELS[currentLevelId];
        const status = level.checkVictory(engine);
        
        levelProgressMsg.textContent = status.message;
        
        if (status.won) {
            levelWon = true;
            isPlaying = false;
            updatePlayPauseUI();
            
            levelStatus.textContent = '挑战成功';
            levelStatus.className = 'level-status-won';
            
            // Show Success Overlay
            victoryMsg.textContent = status.message;
            victoryOverlay.classList.remove('hidden');
        }
    }

    // -------------------------------------------------------------
    // EVENT BINDINGS
    // -------------------------------------------------------------
    
    // Tab switching
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterPalette(tab.dataset.category);
        });
    });

    // Level select dropdown
    levelSelect.addEventListener('change', (e) => {
        loadLevel(parseInt(e.target.value));
    });

    // Reset current level
    resetLevelBtn.addEventListener('click', () => {
        loadLevel(currentLevelId);
    });

    // Next Level trigger in success modal
    nextLevelBtn.addEventListener('click', () => {
        const nextId = (currentLevelId + 1) % LEVELS.length;
        levelSelect.value = nextId;
        loadLevel(nextId);
    });

    // Play / Pause toggler
    function togglePlayPause() {
        isPlaying = !isPlaying;
        updatePlayPauseUI();
    }

    function updatePlayPauseUI() {
        if (isPlaying) {
            playPauseBtn.classList.add('active');
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playPauseBtn.classList.remove('active');
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }

    playPauseBtn.addEventListener('click', togglePlayPause);
    
    // Single Step Simulation
    stepBtn.addEventListener('click', () => {
        isPlaying = false;
        updatePlayPauseUI();
        engine.step();
        checkLevelProgress();
    });

    // Clear Screen
    clearBtn.addEventListener('click', () => {
        engine.clear();
        if (currentLevelId !== 0) {
            // Re-initialize level boundaries/items instead of leaving it completely black
            LEVELS[currentLevelId].init(engine);
        }
    });

    // Wind Control
    windSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        engine.wind = val;
        if (val === 0) {
            windVal.textContent = '无';
        } else {
            windVal.textContent = val > 0 ? `东风 (${Math.abs(val)}级)` : `西风 (${Math.abs(val)}级)`;
        }
    });

    // Gravity selection buttons
    gravityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gravityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            engine.gravity = btn.dataset.gravity;
            // Wake up all chunks to respond to gravity shift
            engine.activeChunks.fill(1);
            engine.nextActiveChunks.fill(1);
        });
    });

    // Brush Size
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        brushSizeVal.textContent = brushSize;
    });

    // Simulation Speed Multiplier
    simSpeedSlider.addEventListener('input', (e) => {
        simSpeed = parseInt(e.target.value);
        simSpeedVal.textContent = `${simSpeed}x`;
    });

    // Help Modal Triggers
    helpToggle.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
    modalClose.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });

    // -------------------------------------------------------------
    // CANVAS COORDINATES & BRUSH INTERPOLATION
    // -------------------------------------------------------------
    function getGridCoords(e) {
        const rect = canvas.getBoundingClientRect();
        
        // Touch events vs Mouse events
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const scaleX = simWidth / rect.width;
        const scaleY = simHeight / rect.height;
        
        const x = Math.floor((clientX - rect.left) * scaleX);
        const y = Math.floor((clientY - rect.top) * scaleY);
        
        return { x, y };
    }

    // Paint pixels along a line between two coordinates (Bresenham's algorithm)
    function paintLine(x0, y0, x1, y1, radius, id) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        // Cap to prevent long-hangs if input is corrupt
        let loopSafety = 0;
        const maxTicks = Math.max(simWidth, simHeight) * 2;

        while (loopSafety++ < maxTicks) {
            engine.paint(x, y, radius, id);
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    function handleStart(e) {
        if (levelWon) return;
        isPainting = true;
        const coords = getGridCoords(e);
        engine.paint(coords.x, coords.y, brushSize - 1, selectedMaterialId);
        lastPaintX = coords.x;
        lastPaintY = coords.y;
        e.preventDefault();
    }

    function handleMove(e) {
        if (!isPainting || levelWon) return;
        const coords = getGridCoords(e);
        
        if (lastPaintX !== null && lastPaintY !== null) {
            paintLine(lastPaintX, lastPaintY, coords.x, coords.y, brushSize - 1, selectedMaterialId);
        } else {
            engine.paint(coords.x, coords.y, brushSize - 1, selectedMaterialId);
        }
        
        lastPaintX = coords.x;
        lastPaintY = coords.y;
        e.preventDefault();
    }

    function handleEnd() {
        isPainting = false;
        lastPaintX = null;
        lastPaintY = null;
    }

    // Mouse Listeners
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    // Touch Listeners (Mobile friendly)
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    // -------------------------------------------------------------
    // KEYBOARD SHORTCUTS
    // -------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        // Space -> Pause/Play
        if (e.key === ' ' || e.code === 'Space') {
            togglePlayPause();
            e.preventDefault();
        }
        // C -> Clear
        if (e.key === 'c' || e.key === 'C') {
            clearBtn.click();
        }
        // S -> Single Step
        if (e.key === 's' || e.key === 'S') {
            stepBtn.click();
        }
        // R -> Reset Level
        if (e.key === 'r' || e.key === 'R') {
            if (currentLevelId !== 0) resetLevelBtn.click();
        }
        
        // 1-9 Keys for quick select
        const key = parseInt(e.key);
        if (key >= 1 && key <= 9) {
            const allowed = LEVELS[currentLevelId].allowedMaterials;
            // Get material from allowed list
            if (key <= allowed.length) {
                selectMaterial(allowed[key - 1]);
            }
        }
    });

    // -------------------------------------------------------------
    // MAIN APP LOOP
    // -------------------------------------------------------------
    function updateLoop() {
        // Run physics steps if playing
        if (isPlaying) {
            for (let i = 0; i < simSpeed; i++) {
                engine.step();
            }
            checkLevelProgress();
        }

        // Render buffer onto Canvas ImageData
        engine.render(imageData);
        ctx.putImageData(imageData, 0, 0);

        // Update statistics displays
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 500) {
            fps = Math.round((frameCount * 1000) / (now - lastTime));
            fpsVal.textContent = fps;
            
            // Count total active chunks
            let activeCount = 0;
            for (let i = 0; i < engine.numChunks; i++) {
                if (engine.activeChunks[i] === 1) activeCount++;
            }
            activeChunksVal.textContent = `${activeCount} / ${engine.numChunks}`;
            
            // Count total particles
            let particleCount = 0;
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] !== MATERIAL_IDS.AIR) particleCount++;
            }
            particlesVal.textContent = particleCount;

            frameCount = 0;
            lastTime = now;
        }

        requestAnimationFrame(updateLoop);
    }

    // -------------------------------------------------------------
    // START APPLICATION
    // -------------------------------------------------------------
    initLevelSelect();
    buildMaterialsGrid();
    loadLevel(0); // Load sandbox first
    selectMaterial(MATERIAL_IDS.SAND); // Default selected material
    
    // Trigger loop
    requestAnimationFrame(updateLoop);
});
