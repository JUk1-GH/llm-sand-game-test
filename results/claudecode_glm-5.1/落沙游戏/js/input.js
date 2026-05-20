// input.js - 鼠标/触摸输入

class InputHandler {
    constructor(canvas, sim) {
        this.canvas = canvas;
        this.sim = sim;
        this.isDrawing = false;
        this.lastX = -1;
        this.lastY = -1;
        this.selectedMaterial = Materials.SAND;
        this.brushSize = 3;

        // 鼠标事件
        canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
        window.addEventListener('mouseup', () => this.onPointerUp());

        // 触摸事件
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onPointerDown(e.touches[0]);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onPointerMove(e.touches[0]);
        }, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onPointerUp();
        }, { passive: false });

        // 键盘快捷键
        this.keyMap = {};
        for (const m of MaterialUI) {
            this.keyMap[m.key] = m.id;
        }
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyMap[key] !== undefined) {
                this.selectedMaterial = this.keyMap[key];
                if (window.onMaterialSelect) window.onMaterialSelect(this.selectedMaterial);
            }
        });
    }

    // 屏幕坐标转网格坐标
    screenToGrid(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = CANVAS_W / rect.width;
        const scaleY = CANVAS_H / rect.height;
        const gx = Math.floor((clientX - rect.left) * scaleX / PIXEL_SCALE);
        const gy = Math.floor((clientY - rect.top) * scaleY / PIXEL_SCALE);
        return [gx, gy];
    }

    onPointerDown(e) {
        this.isDrawing = true;
        const [gx, gy] = this.screenToGrid(e.clientX, e.clientY);
        this.lastX = gx;
        this.lastY = gy;
        this.sim.place(gx, gy, this.selectedMaterial, this.brushSize);
    }

    onPointerMove(e) {
        if (!this.isDrawing) return;
        const [gx, gy] = this.screenToGrid(e.clientX, e.clientY);

        // 线性插值：避免快速移动时出现间断
        if (this.lastX >= 0) {
            const dx = gx - this.lastX;
            const dy = gy - this.lastY;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            for (let s = 1; s <= steps; s++) {
                const ix = Math.round(this.lastX + dx * s / steps);
                const iy = Math.round(this.lastY + dy * s / steps);
                this.sim.place(ix, iy, this.selectedMaterial, this.brushSize);
            }
        }

        this.lastX = gx;
        this.lastY = gy;
    }

    onPointerUp() {
        this.isDrawing = false;
        this.lastX = -1;
        this.lastY = -1;
    }
}
