// ui.js - UI控件绑定

class UI {
    constructor(input) {
        this.input = input;
        this.materialButtons = [];
        this.buildMaterialPanel();
        this.buildControls();
        this.updateSelection();
    }

    buildMaterialPanel() {
        const panel = document.getElementById('material-panel');
        if (!panel) return;

        for (const m of MaterialUI) {
            const btn = document.createElement('button');
            btn.className = 'material-btn';
            btn.dataset.materialId = m.id;
            const color = getMaterialColor(m.id);
            btn.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
            btn.innerHTML = `<span class="btn-label">${m.name}</span><span class="btn-key">${m.key}</span>`;
            btn.addEventListener('click', () => {
                this.input.selectedMaterial = m.id;
                this.updateSelection();
            });
            panel.appendChild(btn);
            this.materialButtons.push(btn);
        }
    }

    buildControls() {
        // 笔刷大小
        const brushSlider = document.getElementById('brush-size');
        const brushLabel = document.getElementById('brush-label');
        if (brushSlider) {
            brushSlider.addEventListener('input', () => {
                this.input.brushSize = parseInt(brushSlider.value);
                if (brushLabel) brushLabel.textContent = brushSlider.value;
            });
        }

        // 暂停/继续
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (window.togglePause) window.togglePause();
                pauseBtn.textContent = window.isPaused ? '▶ 继续' : '⏸ 暂停';
            });
        }

        // 清除
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (window.clearSim) window.clearSim();
            });
        }

        // 橡皮擦
        const eraserBtn = document.getElementById('eraser-btn');
        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                this.input.selectedMaterial = Materials.EMPTY;
                this.updateSelection();
            });
        }
    }

    updateSelection() {
        const selected = this.input.selectedMaterial;
        for (const btn of this.materialButtons) {
            if (parseInt(btn.dataset.materialId) === selected) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        }
        // 橡皮擦按钮
        const eraserBtn = document.getElementById('eraser-btn');
        if (eraserBtn) {
            if (selected === Materials.EMPTY) {
                eraserBtn.classList.add('selected');
            } else {
                eraserBtn.classList.remove('selected');
            }
        }
    }

    updateFPS(fps) {
        const fpsEl = document.getElementById('fps');
        if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
    }
}

// 键盘选择回调
window.onMaterialSelect = function(materialId) {
    if (window.uiInstance) {
        window.uiInstance.input.selectedMaterial = materialId;
        window.uiInstance.updateSelection();
    }
};
