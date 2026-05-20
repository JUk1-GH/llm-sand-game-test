// main.js - 初始化 + 游戏循环

(function() {
    'use strict';

    const canvas = document.getElementById('canvas');
    const sim = new Simulation();
    const renderer = new Renderer(canvas);
    const input = new InputHandler(canvas, sim);
    const ui = new UI(input);
    window.uiInstance = ui;

    window.isPaused = false;
    window.clearSim = () => sim.clearAll();
    window.togglePause = () => { window.isPaused = !window.isPaused; };

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    function gameLoop(now) {
        requestAnimationFrame(gameLoop);

        // FPS 计算
        frameCount++;
        if (now - lastTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = now;
            ui.updateFPS(fps);
        }

        if (!window.isPaused) {
            sim.update();
        }

        renderer.render(sim);
    }

    requestAnimationFrame(gameLoop);
})();
