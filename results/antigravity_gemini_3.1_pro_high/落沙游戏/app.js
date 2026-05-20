document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    
    // UI Elements
    const materialGrid = document.getElementById('materialGrid');
    const brushSizeSlider = document.getElementById('brushSize');
    const brushSizeVal = document.getElementById('brushSizeVal');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnClear = document.getElementById('btnClear');

    // Engine setup
    const SIM_WIDTH = 250;
    const SIM_HEIGHT = 150;
    const PIXEL_SCALE = 4; // visual multiplier
    
    canvas.width = SIM_WIDTH;
    canvas.height = SIM_HEIGHT;
    canvas.style.width = `${SIM_WIDTH * PIXEL_SCALE}px`;
    canvas.style.height = `${SIM_HEIGHT * PIXEL_SCALE}px`;
    
    const engine = new Engine(SIM_WIDTH, SIM_HEIGHT);
    
    // ImageData buffer for fast drawing
    const imageData = ctx.createImageData(SIM_WIDTH, SIM_HEIGHT);
    const buf = new ArrayBuffer(imageData.data.length);
    const buf8 = new Uint8ClampedArray(buf);
    const data32 = new Uint32Array(buf);
    
    // Initial solid bounds
    engine.clear();

    // State
    let isRunning = true;
    let currentMaterial = MATERIALS.SAND.id;
    let brushSize = parseInt(brushSizeSlider.value);
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    // Build Material UI
    Object.values(MATERIALS).forEach(mat => {
        const btn = document.createElement('button');
        btn.className = `mat-btn ${mat.id === currentMaterial ? 'active' : ''}`;
        btn.dataset.id = mat.id;
        
        const colorSpan = document.createElement('span');
        colorSpan.className = 'mat-color';
        colorSpan.style.backgroundColor = `rgb(${mat.color[0]}, ${mat.color[1]}, ${mat.color[2]})`;
        
        btn.appendChild(colorSpan);
        btn.appendChild(document.createTextNode(mat.name));
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMaterial = mat.id;
        });
        
        materialGrid.appendChild(btn);
    });

    // Brush Size
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        brushSizeVal.textContent = brushSize;
    });

    // Controls
    btnPlayPause.addEventListener('click', () => {
        isRunning = !isRunning;
        btnPlayPause.textContent = isRunning ? 'Play' : 'Pause';
        btnPlayPause.classList.toggle('danger', !isRunning);
    });

    btnClear.addEventListener('click', () => {
        engine.clear();
    });

    // Drawing Logic
    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if(e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: Math.floor((clientX - rect.left) * scaleX),
            y: Math.floor((clientY - rect.top) * scaleY)
        };
    }

    function drawLine(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            drawCircle(x0, y0);
            if ((x0 === x1) && (y0 === y1)) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    function drawCircle(centerX, centerY) {
        const radiusLog = brushSize / 2;
        const radSq = radiusLog * radiusLog;
        for (let y = -brushSize; y <= brushSize; y++) {
            for (let x = -brushSize; x <= brushSize; x++) {
                if (x*x + y*y <= radSq) {
                    const mType = Object.values(MATERIALS).find(m=>m.id === currentMaterial).type;
                    if((mType === 'powder' || mType === 'gas') && Math.random() > 0.4) continue;
                    
                    if (currentMaterial === MATERIALS.EMPTY.id || engine.getMaterial(centerX + x, centerY + y) === MATERIALS.EMPTY.id) {
                        engine.setMaterial(centerX + x, centerY + y, currentMaterial);
                    }
                }
            }
        }
    }

    function handleInputStart(e) {
        isDrawing = true;
        const pos = getCanvasPos(e);
        lastX = pos.x;
        lastY = pos.y;
        drawLine(pos.x, pos.y, pos.x, pos.y);
    }

    function handleInputMove(e) {
        if (!isDrawing) return;
        const pos = getCanvasPos(e);
        drawLine(lastX, lastY, pos.x, pos.y);
        lastX = pos.x;
        lastY = pos.y;
    }

    function handleInputEnd() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', handleInputStart);
    window.addEventListener('mousemove', handleInputMove);
    window.addEventListener('mouseup', handleInputEnd);
    
    canvas.addEventListener('touchstart', handleInputStart, {passive: true});
    window.addEventListener('touchmove', handleInputMove, {passive: true});
    window.addEventListener('touchend', handleInputEnd);

    // Initial default layout
    engine.setMaterial(SIM_WIDTH/2 | 0, 50, MATERIALS.WATER.id);

    // Main Loop
    function loop() {
        if (isRunning) {
            engine.update();
        }
        
        data32.set(engine.colors);
        imageData.data.set(buf8);
        ctx.putImageData(imageData, 0, 0);

        requestAnimationFrame(loop);
    }
    
    loop();
});
