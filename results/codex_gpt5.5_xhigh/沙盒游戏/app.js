(function bootFallingSandApp() {
  "use strict";

  const { AMBIENT_TEMP, FallingSandWorld, ID, MATERIALS, STATE_LABELS } =
    window.FallingSandEngine;

  const canvas = document.getElementById("world");
  const ctx = canvas.getContext("2d", { alpha: false });
  const wrap = document.getElementById("canvas-wrap");
  const cursor = document.getElementById("cursor-preview");
  const materialGrid = document.getElementById("material-grid");
  const selectedLabel = document.getElementById("selected-label");
  const brushInput = document.getElementById("brush-size");
  const brushValue = document.getElementById("brush-value");
  const speedInput = document.getElementById("sim-speed");
  const speedValue = document.getElementById("speed-value");
  const togglePause = document.getElementById("toggle-pause");
  const stepOnce = document.getElementById("step-once");
  const clearWorld = document.getElementById("clear-world");
  const coolWorld = document.getElementById("cool-world");
  const fpsNode = document.getElementById("fps");
  const particlesNode = document.getElementById("particles");
  const worldSizeNode = document.getElementById("world-size");
  const probeCoords = document.getElementById("probe-coords");
  const probeMaterial = document.getElementById("probe-material");
  const probeState = document.getElementById("probe-state");
  const probeTemp = document.getElementById("probe-temp");
  const probeDensity = document.getElementById("probe-density");

  const colorCache = MATERIALS.map((material) => material.colors.map(hexToRgb));
  let world = new FallingSandWorld({ cols: 210, rows: 140 });
  let imageData = null;
  let selectedId = ID.sand;
  let brushSize = Number(brushInput.value);
  let brushShape = "circle";
  let speed = Number(speedInput.value);
  let paused = false;
  let drawing = false;
  let lastTime = performance.now();
  let stepAccumulator = 0;
  let frameCounter = 0;
  let fpsTime = performance.now();
  let lastProbe = { x: -1, y: -1 };
  let resizeTimer = 0;

  setupPalette();
  setupControls();
  fitWorld();
  buildScene("garden");
  render();
  updateStats(true);
  requestAnimationFrame(loop);

  function setupPalette() {
    MATERIALS.forEach((material) => {
      const button = document.createElement("button");
      const swatch = document.createElement("span");
      const name = document.createElement("span");
      const colors = material.colors.join(", ");

      button.type = "button";
      button.className = "material-button";
      button.dataset.material = String(material.id);
      button.setAttribute("aria-pressed", material.id === selectedId ? "true" : "false");
      button.title = `${material.name} / ${STATE_LABELS[material.state]} / ${formatDensity(
        material.density,
      )}`;

      swatch.className = "swatch";
      swatch.style.background = `linear-gradient(135deg, ${colors})`;
      name.className = "material-name";
      name.textContent = material.name;

      button.append(swatch, name);
      button.addEventListener("click", () => selectMaterial(material.id));
      materialGrid.append(button);
    });
    refreshMaterialButtons();
  }

  function setupControls() {
    brushInput.addEventListener("input", () => {
      brushSize = Number(brushInput.value);
      brushValue.textContent = String(brushSize);
      updateCursor(lastProbe.x, lastProbe.y);
    });

    speedInput.addEventListener("input", () => {
      speed = Number(speedInput.value);
      speedValue.textContent = `${speed.toFixed(1)}x`;
    });

    document.querySelectorAll("[data-brush]").forEach((button) => {
      button.addEventListener("click", () => {
        brushShape = button.dataset.brush;
        document
          .querySelectorAll("[data-brush]")
          .forEach((item) => item.classList.toggle("active", item === button));
        updateCursor(lastProbe.x, lastProbe.y);
      });
    });

    togglePause.addEventListener("click", () => {
      paused = !paused;
      togglePause.textContent = paused ? "继续" : "暂停";
      togglePause.setAttribute("aria-pressed", String(paused));
      togglePause.classList.toggle("primary", !paused);
    });

    stepOnce.addEventListener("click", () => {
      world.stepOnce();
      render();
      updateStats(true);
    });

    clearWorld.addEventListener("click", () => {
      world.clear();
      render();
      updateStats(true);
    });

    coolWorld.addEventListener("click", () => {
      world.cool(0.35);
      render();
    });

    document.querySelectorAll("[data-scene]").forEach((button) => {
      button.addEventListener("click", () => {
        buildScene(button.dataset.scene);
        render();
        updateStats(true);
      });
    });

    wrap.addEventListener("contextmenu", (event) => event.preventDefault());
    wrap.addEventListener("pointerdown", (event) => {
      drawing = true;
      wrap.setPointerCapture(event.pointerId);
      paintFromEvent(event);
    });
    wrap.addEventListener("pointermove", (event) => {
      const point = eventToCell(event);
      updateCursor(point.x, point.y);
      updateProbe(point.x, point.y);
      if (drawing) paintFromEvent(event);
    });
    wrap.addEventListener("pointerup", stopDrawing);
    wrap.addEventListener("pointercancel", stopDrawing);
    wrap.addEventListener("pointerleave", () => {
      cursor.style.opacity = "0";
    });
    wrap.addEventListener("pointerenter", (event) => {
      const point = eventToCell(event);
      updateCursor(point.x, point.y);
    });

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (event.target && ["input", "button"].includes(event.target.tagName.toLowerCase())) return;

      if (key === " ") {
        event.preventDefault();
        togglePause.click();
      } else if (key === "c") {
        world.clear();
      } else if (key === "[") {
        brushInput.value = String(Math.max(1, brushSize - 1));
        brushInput.dispatchEvent(new Event("input"));
      } else if (key === "]") {
        brushInput.value = String(Math.min(28, brushSize + 1));
        brushInput.dispatchEvent(new Event("input"));
      } else if (/^[1-9]$/.test(key)) {
        const paintables = MATERIALS.filter((material) => material.id !== ID.smoke);
        const index = Number(key) - 1;
        if (paintables[index]) selectMaterial(paintables[index].id);
      }
    });

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        fitWorld();
        buildScene("garden");
        render();
        updateStats(true);
      }, 180);
    });
  }

  function selectMaterial(id) {
    selectedId = id;
    selectedLabel.textContent = MATERIALS[selectedId].name;
    refreshMaterialButtons();
  }

  function refreshMaterialButtons() {
    materialGrid.querySelectorAll(".material-button").forEach((button) => {
      const active = Number(button.dataset.material) === selectedId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function fitWorld() {
    const rect = wrap.getBoundingClientRect();
    const targetCellSize = rect.width < 640 ? 4 : 5;
    const cols = clamp(Math.round(rect.width / targetCellSize), 96, 260);
    const rows = clamp(Math.round(rect.height / targetCellSize), 80, 180);

    world = new FallingSandWorld({ cols, rows });
    canvas.width = cols;
    canvas.height = rows;
    imageData = ctx.createImageData(cols, rows);
    worldSizeNode.textContent = `${cols} x ${rows}`;
  }

  function paintFromEvent(event) {
    event.preventDefault();
    const point = eventToCell(event);
    const paintId = event.button === 2 || (event.buttons & 2) ? ID.empty : selectedId;
    world.paint(point.x, point.y, brushSize, paintId, brushShape);
    updateProbe(point.x, point.y);
  }

  function stopDrawing(event) {
    drawing = false;
    if (event && wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
  }

  function eventToCell(event) {
    const rect = canvas.getBoundingClientRect();
    const x = clamp(Math.floor(((event.clientX - rect.left) / rect.width) * world.cols), 0, world.cols - 1);
    const y = clamp(Math.floor(((event.clientY - rect.top) / rect.height) * world.rows), 0, world.rows - 1);
    return { x, y };
  }

  function updateCursor(x, y) {
    if (x < 0 || y < 0) return;
    const rect = canvas.getBoundingClientRect();
    const cellW = rect.width / world.cols;
    const cellH = rect.height / world.rows;
    const diameter = Math.max(8, brushSize * 2 * Math.max(cellW, cellH));
    cursor.style.width = `${diameter}px`;
    cursor.style.height = `${diameter}px`;
    cursor.style.transform = `translate(${x * cellW - diameter / 2}px, ${y * cellH - diameter / 2}px)`;
    cursor.style.opacity = "1";
    cursor.classList.toggle("square", brushShape === "square");
    lastProbe = { x, y };
  }

  function updateProbe(x, y) {
    const sample = world.sample(x, y);
    probeCoords.textContent = `${x}, ${y}`;
    probeMaterial.textContent = sample.material.name;
    probeState.textContent = STATE_LABELS[sample.material.state];
    probeTemp.textContent = `${Math.round(sample.temp)} C`;
    probeDensity.textContent = formatDensity(sample.material.density);
  }

  function loop(now) {
    const dt = Math.min(80, now - lastTime);
    lastTime = now;

    if (!paused && speed > 0) {
      stepAccumulator += (dt / 16.67) * speed;
      const steps = Math.min(8, Math.floor(stepAccumulator));
      if (steps > 0) {
        world.step(steps);
        stepAccumulator -= steps;
      }
    }

    render();
    updateStats(false, now);
    requestAnimationFrame(loop);
  }

  function render() {
    const data = imageData.data;
    const tick = world.tick;

    for (let i = 0; i < world.size; i += 1) {
      const id = world.cells[i];
      const material = MATERIALS[id];
      const colors = colorCache[id];
      const animationOffset =
        id === ID.fire || id === ID.lava || id === ID.water || id === ID.acid || id === ID.steam
          ? tick >> 2
          : 0;
      let color = colors[(world.seed[i] + animationOffset + i) % colors.length];
      const temp = world.heat[i];

      if (id !== ID.empty && temp > 145) {
        color = mixRgb(color, [255, 99, 44], clamp((temp - 145) / 520, 0, 0.62));
      } else if (id !== ID.empty && temp < 0) {
        color = mixRgb(color, [175, 230, 255], clamp(Math.abs(temp) / 80, 0, 0.5));
      }

      if (id === ID.smoke) {
        color = mixRgb(color, [5, 7, 7], clamp(1 - world.life[i] / 180, 0.05, 0.55));
      }

      const p = i * 4;
      data[p] = color[0];
      data[p + 1] = color[1];
      data[p + 2] = color[2];
      data[p + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function updateStats(force, now) {
    frameCounter += 1;
    const time = now || performance.now();
    if (!force && time - fpsTime < 280) return;

    const elapsed = Math.max(1, time - fpsTime);
    fpsNode.textContent = String(Math.round((frameCounter * 1000) / elapsed));
    particlesNode.textContent = formatNumber(world.countParticles());
    frameCounter = 0;
    fpsTime = time;
  }

  function buildScene(name) {
    world.clear();
    if (name === "volcano") {
      buildVolcano();
    } else if (name === "rain") {
      buildRain();
    } else if (name === "pipes") {
      buildPipes();
    } else {
      buildGarden();
    }
  }

  function buildGarden() {
    const floor = world.rows - 8;
    fillRect(0, floor, world.cols, 8, ID.sand);
    fillRect(0, world.rows - 3, world.cols, 3, ID.stone);
    fillRect(0, floor - 2, 4, 10, ID.stone);
    fillRect(world.cols - 4, floor - 2, 4, 10, ID.stone);

    const pondX = Math.round(world.cols * 0.14);
    const pondW = Math.round(world.cols * 0.22);
    fillRect(pondX, floor - 9, pondW, 2, ID.stone);
    fillRect(pondX, floor - 9, 2, 9, ID.stone);
    fillRect(pondX + pondW - 2, floor - 9, 2, 9, ID.stone);
    fillRect(pondX + 2, floor - 8, pondW - 4, 8, ID.water);

    const planterX = Math.round(world.cols * 0.5);
    fillRect(planterX, floor - 7, Math.round(world.cols * 0.23), 2, ID.wood);
    fillRect(planterX, floor - 5, Math.round(world.cols * 0.23), 5, ID.sand);
    for (let x = planterX + 4; x < planterX + world.cols * 0.21; x += 5) {
      fillRect(x, floor - 9 - Math.round(Math.random() * 5), 2, 7, ID.plant);
    }

    sprinkle(ID.salt, Math.round(world.cols * 0.78), floor - 16, 15, 70);
    sprinkle(ID.oil, Math.round(world.cols * 0.64), floor - 22, 10, 50);
    fillRect(Math.round(world.cols * 0.81), floor - 22, 18, 2, ID.metal);
  }

  function buildRain() {
    const floor = world.rows - 7;
    fillRect(0, floor, world.cols, 7, ID.sand);
    fillRect(0, world.rows - 3, world.cols, 3, ID.stone);
    for (let i = 0; i < world.cols * 0.85; i += 1) {
      const x = Math.floor(Math.random() * world.cols);
      const y = Math.floor(Math.random() * Math.max(8, world.rows * 0.32));
      world.setCell(x, y, ID.water);
    }
    for (let i = 0; i < 28; i += 1) {
      fillRect(
        Math.floor(Math.random() * world.cols),
        floor - Math.floor(Math.random() * 14),
        2 + Math.floor(Math.random() * 7),
        2,
        ID.stone,
      );
    }
    fillRect(Math.round(world.cols * 0.62), floor - 18, 24, 6, ID.wood);
  }

  function buildVolcano() {
    const floor = world.rows - 5;
    fillRect(0, floor, world.cols, 5, ID.stone);
    const center = Math.round(world.cols * 0.5);
    const height = Math.round(world.rows * 0.44);

    for (let y = 0; y < height; y += 1) {
      const half = Math.round((height - y) * 0.72);
      const rowY = floor - y - 1;
      fillRect(center - half, rowY, half * 2, 1, ID.stone);
      if (y > 7 && y < height - 5) fillRect(center - 4, rowY, 8, 1, ID.lava);
      if (y > 4 && Math.random() < 0.7) {
        world.setCell(center - half + 2, rowY, ID.sand);
        world.setCell(center + half - 3, rowY, ID.sand);
      }
    }

    fillRect(center - 7, floor - height - 6, 14, 8, ID.lava);
    sprinkle(ID.fire, center, floor - height - 13, 11, 34);
    sprinkle(ID.smoke, center, floor - height - 20, 16, 70);
    fillRect(8, floor - 16, Math.round(world.cols * 0.22), 14, ID.water);
    fillRect(8, floor - 17, Math.round(world.cols * 0.22), 2, ID.stone);
  }

  function buildPipes() {
    const floor = world.rows - 5;
    fillRect(0, floor, world.cols, 5, ID.stone);
    fillRect(0, 0, 4, world.rows, ID.stone);
    fillRect(world.cols - 4, 0, 4, world.rows, ID.stone);

    const pipeY = Math.round(world.rows * 0.32);
    fillRect(16, pipeY, world.cols - 32, 3, ID.metal);
    fillRect(16, pipeY + 14, world.cols - 32, 3, ID.metal);
    fillRect(16, pipeY, 3, 17, ID.metal);
    fillRect(world.cols - 19, pipeY, 3, 17, ID.metal);
    fillRect(20, pipeY + 3, Math.round(world.cols * 0.32), 11, ID.water);
    fillRect(Math.round(world.cols * 0.5), pipeY + 3, Math.round(world.cols * 0.24), 11, ID.oil);

    fillRect(Math.round(world.cols * 0.24), floor - 24, 32, 19, ID.sand);
    fillRect(Math.round(world.cols * 0.62), floor - 18, 28, 13, ID.acid);
    fillRect(Math.round(world.cols * 0.74), floor - 38, 14, 33, ID.wood);
    sprinkle(ID.fire, Math.round(world.cols * 0.74), floor - 42, 7, 15);
  }

  function fillRect(x, y, width, height, materialId) {
    const material = MATERIALS[materialId];
    const startX = clamp(Math.floor(x), 0, world.cols);
    const startY = clamp(Math.floor(y), 0, world.rows);
    const endX = clamp(Math.ceil(x + width), 0, world.cols);
    const endY = clamp(Math.ceil(y + height), 0, world.rows);

    for (let yy = startY; yy < endY; yy += 1) {
      for (let xx = startX; xx < endX; xx += 1) {
        world.setCell(xx, yy, materialId, material.baseTemp, material.paintLife || material.defaultLife || 0);
      }
    }
  }

  function sprinkle(materialId, cx, cy, radius, amount) {
    const material = MATERIALS[materialId];
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      const x = Math.round(cx + Math.cos(angle) * distance);
      const y = Math.round(cy + Math.sin(angle) * distance);
      if (world.inBounds(x, y)) {
        world.setCell(x, y, materialId, material.baseTemp, material.paintLife || material.defaultLife || 0);
      }
    }
  }

  function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ];
  }

  function mixRgb(a, b, amount) {
    const t = clamp(amount, 0, 1);
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatDensity(value) {
    if (value === 0) return "--";
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN").format(value);
  }
})();
