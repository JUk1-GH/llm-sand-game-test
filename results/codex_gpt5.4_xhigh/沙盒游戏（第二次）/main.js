const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d", { alpha: false });

const controls = {
  pauseButton: document.getElementById("pauseButton"),
  stepButton: document.getElementById("stepButton"),
  clearButton: document.getElementById("clearButton"),
  fillButton: document.getElementById("fillButton"),
  brushSize: document.getElementById("brushSize"),
  brushFlow: document.getElementById("brushFlow"),
  simSpeed: document.getElementById("simSpeed"),
  particleCount: document.getElementById("particleCount"),
  fpsValue: document.getElementById("fpsValue"),
  selectedLabel: document.getElementById("selectedLabel"),
  brushLabel: document.getElementById("brushLabel"),
  statusBadge: document.getElementById("statusBadge"),
  materialGrid: document.getElementById("materialGrid"),
  materialDescription: document.getElementById("materialDescription"),
};

const GRID_WIDTH = 180;
const GRID_HEIGHT = 120;
const CELL_COUNT = GRID_WIDTH * GRID_HEIGHT;

canvas.width = GRID_WIDTH;
canvas.height = GRID_HEIGHT;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const chance = (value) => Math.random() < value;
const int = (value) => value | 0;

const makePalette = (...colors) => colors;

const MAT = {
  AIR: 0,
  SAND: 1,
  WATER: 2,
  STONE: 3,
  WOOD: 4,
  FIRE: 5,
  STEAM: 6,
  OIL: 7,
  ACID: 8,
  LAVA: 9,
  GLASS: 10,
};

const MATERIALS = [
  {
    id: MAT.AIR,
    key: "air",
    name: "空气",
    description: "空白网格，用于承载其他材质。",
    category: "gas",
    density: 0,
    palette: makePalette("#0d1018", "#111821", "#151d28"),
    brushable: false,
  },
  {
    id: MAT.SAND,
    key: "sand",
    name: "沙子",
    description: "典型粉末，会形成斜坡，可被水冲开，被熔岩熔成玻璃。",
    category: "powder",
    density: 5,
    gravity: 1,
    palette: makePalette("#d8b96e", "#c9a357", "#e6ca85"),
    friction: 0.72,
  },
  {
    id: MAT.WATER,
    key: "water",
    name: "水",
    description: "低密度液体，会绕过障碍并冷却火焰与熔岩。",
    category: "liquid",
    density: 3,
    gravity: 1,
    dispersion: 5,
    palette: makePalette("#347ed8", "#50a4ff", "#79c9ff"),
    friction: 0.94,
  },
  {
    id: MAT.STONE,
    key: "stone",
    name: "石头",
    description: "高密度固体，稳定且耐腐蚀，是搭建地形的骨架。",
    category: "solid",
    density: 9,
    palette: makePalette("#5b5552", "#726a65", "#90857e"),
    acidProof: true,
    heatProof: true,
  },
  {
    id: MAT.WOOD,
    key: "wood",
    name: "木头",
    description: "静态可燃固体，适合观察火势蔓延。",
    category: "solid",
    density: 7,
    palette: makePalette("#6f4022", "#88512d", "#a46435"),
    flammable: 0.1,
  },
  {
    id: MAT.FIRE,
    key: "fire",
    name: "火焰",
    description: "短寿命热源，会点燃油和木头，并将水汽化为蒸汽。",
    category: "fire",
    density: 1,
    rise: 1,
    palette: makePalette("#ff7433", "#ffb347", "#ffe28f"),
    lifeMin: 6,
    lifeMax: 18,
    hot: true,
  },
  {
    id: MAT.STEAM,
    key: "steam",
    name: "蒸汽",
    description: "上升气体，寿命结束后会冷凝成水。",
    category: "gas",
    density: 1,
    rise: 1,
    dispersion: 4,
    palette: makePalette("#afcfdd", "#d7e9f2", "#f4fbff"),
    lifeMin: 30,
    lifeMax: 120,
  },
  {
    id: MAT.OIL,
    key: "oil",
    name: "燃油",
    description: "较粘的可燃液体，会在火焰传播下形成火带。",
    category: "liquid",
    density: 2,
    gravity: 1,
    dispersion: 3,
    palette: makePalette("#4c3720", "#725133", "#8d663e"),
    flammable: 0.2,
    friction: 0.88,
  },
  {
    id: MAT.ACID,
    key: "acid",
    name: "酸液",
    description: "会侵蚀大部分材质，自身也会逐渐挥发。",
    category: "liquid",
    density: 4,
    gravity: 1,
    dispersion: 4,
    palette: makePalette("#61c558", "#8de578", "#bafc98"),
    corrosive: true,
    friction: 0.9,
  },
  {
    id: MAT.LAVA,
    key: "lava",
    name: "熔岩",
    description: "高温高密度液体，会点燃邻近材质，遇水凝固。",
    category: "fire",
    density: 6,
    gravity: 1,
    dispersion: 2,
    palette: makePalette("#ff5327", "#ff7f2f", "#ffc14a"),
    hot: true,
    heatProof: true,
  },
  {
    id: MAT.GLASS,
    key: "glass",
    name: "玻璃",
    description: "由高温熔融沙子后形成的脆性固体。",
    category: "solid",
    density: 8,
    palette: makePalette("#95cfd9", "#b8ebef", "#77aab4"),
    acidProof: false,
    heatProof: true,
  },
];

const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((entry) => [entry.id, entry]));

class SandWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height;
    this.cells = new Uint8Array(this.size);
    this.life = new Uint16Array(this.size);
    this.velocityX = new Float32Array(this.size);
    this.velocityY = new Float32Array(this.size);
    this.seed = new Uint8Array(this.size);
    this.updated = new Uint32Array(this.size);
    this.tick = 0;
    this.occupied = 0;
  }

  index(x, y) {
    return x + y * this.width;
  }

  inside(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x, y) {
    return this.inside(x, y) ? this.cells[this.index(x, y)] : MAT.STONE;
  }

  setCell(index, materialId, preserveVelocity = false) {
    const previous = this.cells[index];

    if (previous === materialId) {
      return;
    }

    if (previous === MAT.AIR && materialId !== MAT.AIR) {
      this.occupied += 1;
    } else if (previous !== MAT.AIR && materialId === MAT.AIR) {
      this.occupied -= 1;
    }

    this.cells[index] = materialId;
    this.seed[index] = int(Math.random() * 255);
    this.updated[index] = this.tick;

    if (!preserveVelocity) {
      this.velocityX[index] = 0;
      this.velocityY[index] = 0;
    }

    if (materialId === MAT.FIRE) {
      this.life[index] = 6 + int(Math.random() * 12);
    } else if (materialId === MAT.STEAM) {
      this.life[index] = 30 + int(Math.random() * 90);
    } else if (materialId === MAT.ACID) {
      this.life[index] = 160 + int(Math.random() * 180);
    } else {
      this.life[index] = 0;
    }
  }

  set(x, y, materialId, preserveVelocity = false) {
    if (!this.inside(x, y)) {
      return;
    }

    this.setCell(this.index(x, y), materialId, preserveVelocity);
  }

  clear() {
    this.cells.fill(MAT.AIR);
    this.life.fill(0);
    this.velocityX.fill(0);
    this.velocityY.fill(0);
    this.seed.fill(0);
    this.updated.fill(0);
    this.tick = 0;
    this.occupied = 0;
  }

  swap(aIndex, bIndex) {
    const aMat = this.cells[aIndex];
    const bMat = this.cells[bIndex];
    const aLife = this.life[aIndex];
    const bLife = this.life[bIndex];
    const aSeed = this.seed[aIndex];
    const bSeed = this.seed[bIndex];
    const aVx = this.velocityX[aIndex];
    const bVx = this.velocityX[bIndex];
    const aVy = this.velocityY[aIndex];
    const bVy = this.velocityY[bIndex];

    this.cells[aIndex] = bMat;
    this.cells[bIndex] = aMat;
    this.life[aIndex] = bLife;
    this.life[bIndex] = aLife;
    this.seed[aIndex] = bSeed;
    this.seed[bIndex] = aSeed;
    this.velocityX[aIndex] = bVx;
    this.velocityX[bIndex] = aVx;
    this.velocityY[aIndex] = bVy;
    this.velocityY[bIndex] = aVy;
    this.updated[aIndex] = this.tick;
    this.updated[bIndex] = this.tick;
  }

  moveInto(index, targetIndex) {
    const materialId = this.cells[index];
    const life = this.life[index];
    const seed = this.seed[index];
    const vx = this.velocityX[index];
    const vy = this.velocityY[index];

    this.cells[targetIndex] = materialId;
    this.life[targetIndex] = life;
    this.seed[targetIndex] = seed;
    this.velocityX[targetIndex] = vx;
    this.velocityY[targetIndex] = vy;
    this.updated[targetIndex] = this.tick;

    this.cells[index] = MAT.AIR;
    this.life[index] = 0;
    this.seed[index] = 0;
    this.velocityX[index] = 0;
    this.velocityY[index] = 0;
    this.updated[index] = this.tick;
  }

  attemptMove(index, x, y, targetX, targetY, material) {
    if (!this.inside(targetX, targetY)) {
      return false;
    }

    const targetIndex = this.index(targetX, targetY);
    const targetMaterialId = this.cells[targetIndex];

    if (targetMaterialId === MAT.AIR) {
      this.moveInto(index, targetIndex);
      return true;
    }

    const targetMaterial = MATERIAL_BY_ID[targetMaterialId];

    if (targetMaterialId === MAT.FIRE && material.id === MAT.WATER) {
      this.setCell(targetIndex, MAT.STEAM);
      this.setCell(index, MAT.STEAM);
      return true;
    }

    if (targetMaterialId === MAT.LAVA && material.id === MAT.WATER) {
      this.setCell(targetIndex, chance(0.6) ? MAT.STONE : MAT.GLASS);
      this.setCell(index, MAT.STEAM);
      return true;
    }

    if (targetMaterialId === MAT.FIRE && material.id === MAT.ACID) {
      this.setCell(index, MAT.AIR);
      return true;
    }

    if (targetMaterial.density < material.density && targetMaterial.category !== "solid") {
      this.swap(index, targetIndex);
      return true;
    }

    return false;
  }

  ignite(index) {
    const materialId = this.cells[index];
    if (materialId === MAT.WOOD || materialId === MAT.OIL) {
      this.setCell(index, MAT.FIRE);
      return true;
    }
    return false;
  }

  coolLava(index) {
    if (this.cells[index] !== MAT.LAVA) {
      return;
    }
    this.setCell(index, chance(0.6) ? MAT.STONE : MAT.GLASS);
  }

  corrosionTick(index, x, y) {
    if (!chance(0.2)) {
      return;
    }

    const neighbors = [
      [x, y + 1],
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (!this.inside(nx, ny)) {
        continue;
      }

      const targetIndex = this.index(nx, ny);
      const targetMaterialId = this.cells[targetIndex];

      if (targetMaterialId === MAT.AIR || targetMaterialId === MAT.ACID) {
        continue;
      }

      const targetMaterial = MATERIAL_BY_ID[targetMaterialId];

      if (targetMaterial.acidProof) {
        continue;
      }

      this.setCell(targetIndex, MAT.AIR);
      if (chance(0.25)) {
        this.setCell(index, MAT.AIR);
      }
      break;
    }
  }

  fireTick(index, x, y) {
    this.life[index] = Math.max(0, this.life[index] - 1);
    const neighbors = [
      [x, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x, y + 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (!this.inside(nx, ny)) {
        continue;
      }

      const targetIndex = this.index(nx, ny);
      const targetMaterialId = this.cells[targetIndex];
      const targetMaterial = MATERIAL_BY_ID[targetMaterialId];

      if (targetMaterialId === MAT.WATER) {
        this.setCell(targetIndex, MAT.STEAM);
        this.life[targetIndex] = 50 + int(Math.random() * 40);
        if (chance(0.45)) {
          this.setCell(index, MAT.STEAM);
          return;
        }
      }

      if (targetMaterial.flammable && chance(targetMaterial.flammable)) {
        this.setCell(targetIndex, MAT.FIRE);
      }

      if (targetMaterialId === MAT.SAND && chance(0.015)) {
        this.setCell(targetIndex, MAT.GLASS);
      }
    }

    if (this.life[index] === 0) {
      this.setCell(index, chance(0.35) ? MAT.STEAM : MAT.AIR);
      return;
    }

    this.velocityY[index] = -1.5;
    this.flowGas(index, x, y, MATERIAL_BY_ID[this.cells[index]]);
  }

  steamTick(index, x, y) {
    this.life[index] = Math.max(0, this.life[index] - 1);

    if (chance(0.004)) {
      const below = y + 1 < this.height ? this.index(x, y + 1) : -1;
      if (below >= 0 && this.cells[below] === MAT.AIR) {
        this.setCell(index, MAT.WATER);
        return;
      }
    }

    if (this.life[index] === 0) {
      this.setCell(index, MAT.WATER);
      return;
    }

    this.velocityY[index] = -clamp(this.velocityY[index] - 0.14, 0.5, 2.5);
    this.flowGas(index, x, y, MATERIAL_BY_ID[this.cells[index]]);
  }

  lavaTick(index, x, y) {
    const neighbors = [
      [x, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (!this.inside(nx, ny)) {
        continue;
      }

      const targetIndex = this.index(nx, ny);
      const targetMaterialId = this.cells[targetIndex];

      if (targetMaterialId === MAT.WATER) {
        this.setCell(targetIndex, MAT.STEAM);
        this.coolLava(index);
        return;
      }

      if (targetMaterialId === MAT.WOOD || targetMaterialId === MAT.OIL) {
        this.setCell(targetIndex, MAT.FIRE);
      }

      if (targetMaterialId === MAT.SAND && chance(0.045)) {
        this.setCell(targetIndex, MAT.GLASS);
      }
    }

    this.flowLiquid(index, x, y, MATERIAL_BY_ID[this.cells[index]], true);
  }

  flowPowder(index, x, y, material) {
    this.velocityY[index] = clamp(this.velocityY[index] + 0.55, 0.2, 3);
    const direction = chance(0.5) ? -1 : 1;

    if (this.attemptMove(index, x, y, x, y + 1, material)) {
      return;
    }

    if (this.attemptMove(index, x, y, x + direction, y + 1, material)) {
      return;
    }

    if (this.attemptMove(index, x, y, x - direction, y + 1, material)) {
      return;
    }

    this.velocityY[index] *= material.friction ?? 0.65;
  }

  flowLiquid(index, x, y, material, hot = false) {
    this.velocityY[index] = clamp(this.velocityY[index] + 0.4, 0.2, hot ? 2.2 : 3.2);
    const drift = chance(0.5) ? -1 : 1;

    if (this.attemptMove(index, x, y, x, y + 1, material)) {
      return;
    }

    if (this.attemptMove(index, x, y, x + drift, y + 1, material)) {
      return;
    }

    if (this.attemptMove(index, x, y, x - drift, y + 1, material)) {
      return;
    }

    const spread = material.dispersion ?? 3;
    for (let step = 1; step <= spread; step += 1) {
      if (this.attemptMove(index, x, y, x + drift * step, y, material)) {
        this.velocityX[this.index(x + drift * step, y)] = drift * 0.8;
        return;
      }
    }

    for (let step = 1; step <= spread; step += 1) {
      if (this.attemptMove(index, x, y, x - drift * step, y, material)) {
        this.velocityX[this.index(x - drift * step, y)] = -drift * 0.8;
        return;
      }
    }

    this.velocityX[index] *= material.friction ?? 0.9;
    this.velocityY[index] *= material.friction ?? 0.9;
  }

  flowGas(index, x, y, material) {
    const rise = material.rise ?? 1;
    const drift = chance(0.5) ? -1 : 1;

    if (this.attemptMove(index, x, y, x, y - rise, material)) {
      return;
    }

    if (this.attemptMove(index, x, y, x + drift, y - rise, material)) {
      return;
    }

    if (this.attemptMove(index, x, y, x - drift, y - rise, material)) {
      return;
    }

    const spread = material.dispersion ?? 2;
    for (let step = 1; step <= spread; step += 1) {
      if (this.attemptMove(index, x, y, x + drift * step, y, material)) {
        return;
      }
    }

    if (chance(0.03)) {
      this.setCell(index, MAT.AIR);
    }
  }

  updateCell(index, x, y) {
    const materialId = this.cells[index];

    if (materialId === MAT.AIR || this.updated[index] === this.tick) {
      return;
    }

    const material = MATERIAL_BY_ID[materialId];

    if (materialId === MAT.FIRE) {
      this.fireTick(index, x, y);
      return;
    }

    if (materialId === MAT.STEAM) {
      this.steamTick(index, x, y);
      return;
    }

    if (materialId === MAT.ACID) {
      this.corrosionTick(index, x, y);
      this.flowLiquid(index, x, y, material);
      if (this.life[index] > 0) {
        this.life[index] -= 1;
      }
      if (this.life[index] === 0 && chance(0.01)) {
        this.setCell(index, MAT.AIR);
      }
      return;
    }

    if (materialId === MAT.LAVA) {
      this.lavaTick(index, x, y);
      return;
    }

    if (material.category === "powder") {
      this.flowPowder(index, x, y, material);
      return;
    }

    if (material.category === "liquid") {
      this.flowLiquid(index, x, y, material);
      return;
    }
  }

  step(iterations) {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      this.tick += 1;
      const leftToRight = this.tick % 2 === 0;

      for (let y = this.height - 1; y >= 0; y -= 1) {
        if (leftToRight) {
          for (let x = 0; x < this.width; x += 1) {
            this.updateCell(this.index(x, y), x, y);
          }
        } else {
          for (let x = this.width - 1; x >= 0; x -= 1) {
            this.updateCell(this.index(x, y), x, y);
          }
        }
      }
    }
  }
}

const world = new SandWorld(GRID_WIDTH, GRID_HEIGHT);
const imageData = ctx.createImageData(GRID_WIDTH, GRID_HEIGHT);
const { data } = imageData;

const state = {
  activeMaterial: MAT.SAND,
  brushRadius: Number(controls.brushSize.value),
  brushFlow: Number(controls.brushFlow.value),
  simSpeed: Number(controls.simSpeed.value),
  painting: false,
  erasing: false,
  paused: false,
  lastPaint: null,
  fps: 0,
  lastFrame: performance.now(),
};

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function mixColor(material, seed, x, y) {
  const palette = material.palette;
  const tone = hexToRgb(palette[seed % palette.length]);
  const noise = ((seed * 13 + x * 11 + y * 7) % 24) - 12;
  const edgeShade = y < 2 ? 10 : 0;
  return {
    r: clamp(tone.r + noise + edgeShade, 0, 255),
    g: clamp(tone.g + noise + edgeShade, 0, 255),
    b: clamp(tone.b + noise + edgeShade, 0, 255),
  };
}

function render() {
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const index = world.index(x, y);
      const material = MATERIAL_BY_ID[world.cells[index]];
      const offset = index * 4;

      if (material.id === MAT.AIR) {
        const wave = (x * 3 + y * 2 + world.tick) % 20;
        data[offset] = 10 + wave;
        data[offset + 1] = 12 + wave;
        data[offset + 2] = 18 + wave;
        data[offset + 3] = 255;
        continue;
      }

      const color = mixColor(material, world.seed[index], x, y);
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function linePoints(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let currentX = x0;
  let currentY = y0;

  while (true) {
    points.push([currentX, currentY]);
    if (currentX === x1 && currentY === y1) {
      break;
    }
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      currentX += sx;
    }
    if (e2 <= dx) {
      err += dx;
      currentY += sy;
    }
  }

  return points;
}

function paintAt(centerX, centerY, materialId, erase = false) {
  const radius = state.brushRadius;
  const radiusSquared = radius * radius;

  for (let i = 0; i < state.brushFlow; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = int(centerX + Math.cos(angle) * distance);
    const y = int(centerY + Math.sin(angle) * distance);

    if (!world.inside(x, y)) {
      continue;
    }

    const dx = x - centerX;
    const dy = y - centerY;
    if (dx * dx + dy * dy > radiusSquared) {
      continue;
    }

    world.set(x, y, erase ? MAT.AIR : materialId);
  }
}

function paintStroke(x, y) {
  if (!state.lastPaint) {
    paintAt(x, y, state.activeMaterial, state.erasing);
    state.lastPaint = { x, y };
    return;
  }

  const points = linePoints(state.lastPaint.x, state.lastPaint.y, x, y);
  for (const [px, py] of points) {
    paintAt(px, py, state.activeMaterial, state.erasing);
  }
  state.lastPaint = { x, y };
}

function pointerToGrid(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: clamp(int((event.clientX - rect.left) * scaleX), 0, GRID_WIDTH - 1),
    y: clamp(int((event.clientY - rect.top) * scaleY), 0, GRID_HEIGHT - 1),
  };
}

function setSelectedMaterial(materialId) {
  state.activeMaterial = materialId;
  const material = MATERIAL_BY_ID[materialId];
  controls.selectedLabel.textContent = material.name;
  controls.materialDescription.textContent = material.description;

  for (const button of controls.materialGrid.querySelectorAll(".material-card")) {
    button.classList.toggle("active", Number(button.dataset.id) === materialId);
  }
}

function buildMaterialButtons() {
  const brushMaterials = MATERIALS.filter((material) => material.brushable !== false);
  const fragment = document.createDocumentFragment();

  for (const material of brushMaterials) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material-card";
    button.dataset.id = String(material.id);

    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = `linear-gradient(135deg, ${material.palette.join(", ")})`;

    const title = document.createElement("strong");
    title.textContent = material.name;

    const meta = document.createElement("span");
    meta.textContent =
      material.category === "powder"
        ? "粉末"
        : material.category === "liquid"
          ? "液体"
          : material.category === "gas"
            ? "气体"
            : material.category === "solid"
              ? "固体"
              : "热源";

    button.append(swatch, title, meta);
    button.addEventListener("click", () => setSelectedMaterial(material.id));
    fragment.append(button);
  }

  controls.materialGrid.append(fragment);
  setSelectedMaterial(state.activeMaterial);
}

function buildDemoScene() {
  world.clear();

  for (let x = 12; x < GRID_WIDTH - 12; x += 1) {
    world.set(x, GRID_HEIGHT - 10, MAT.STONE);
    world.set(x, GRID_HEIGHT - 9, MAT.STONE);
  }

  for (let x = 14; x < 80; x += 1) {
    world.set(x, 30, MAT.SAND);
    world.set(x, 31, MAT.SAND);
  }

  for (let y = 24; y < 82; y += 1) {
    world.set(104, y, MAT.STONE);
    if (y > 45) {
      world.set(105, y, MAT.STONE);
    }
  }

  for (let x = 110; x < 150; x += 1) {
    world.set(x, 26, MAT.WATER);
    world.set(x, 27, MAT.WATER);
    world.set(x, 28, MAT.WATER);
  }

  for (let x = 36; x < 58; x += 1) {
    for (let y = 70; y < 76; y += 1) {
      world.set(x, y, MAT.WOOD);
    }
  }

  for (let x = 40; x < 54; x += 1) {
    world.set(x, 68, MAT.OIL);
  }

  for (let x = 126; x < 144; x += 1) {
    world.set(x, 68, MAT.ACID);
    world.set(x, 69, MAT.ACID);
  }

  for (let x = 70; x < 90; x += 1) {
    world.set(x, 90, MAT.LAVA);
  }

  world.set(47, 67, MAT.FIRE);
  world.set(48, 67, MAT.FIRE);
  world.set(82, 89, MAT.FIRE);
}

function updateHud() {
  controls.particleCount.textContent = world.occupied.toLocaleString("zh-CN");
  controls.fpsValue.textContent = String(int(state.fps));
  controls.brushLabel.textContent = String(state.brushRadius);
  controls.statusBadge.textContent = state.paused ? "已暂停" : "运行中";
}

function tick(now) {
  const delta = now - state.lastFrame;
  state.lastFrame = now;
  state.fps = 1000 / Math.max(delta, 1);

  if (!state.paused) {
    world.step(state.simSpeed);
  }

  render();
  updateHud();
  requestAnimationFrame(tick);
}

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("pointerdown", (event) => {
  const point = pointerToGrid(event);
  state.painting = true;
  state.erasing = event.button === 2;
  state.lastPaint = point;
  paintStroke(point.x, point.y);
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.painting) {
    return;
  }
  const point = pointerToGrid(event);
  paintStroke(point.x, point.y);
});

window.addEventListener("pointerup", () => {
  state.painting = false;
  state.lastPaint = null;
});

controls.pauseButton.addEventListener("click", () => {
  state.paused = !state.paused;
  controls.pauseButton.textContent = state.paused ? "继续" : "暂停";
});

controls.stepButton.addEventListener("click", () => {
  world.step(1);
  render();
  updateHud();
});

controls.clearButton.addEventListener("click", () => {
  world.clear();
});

controls.fillButton.addEventListener("click", () => {
  buildDemoScene();
});

controls.brushSize.addEventListener("input", () => {
  state.brushRadius = Number(controls.brushSize.value);
});

controls.brushFlow.addEventListener("input", () => {
  state.brushFlow = Number(controls.brushFlow.value);
});

controls.simSpeed.addEventListener("input", () => {
  state.simSpeed = Number(controls.simSpeed.value);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state.paused = !state.paused;
    controls.pauseButton.textContent = state.paused ? "继续" : "暂停";
  }

  if (event.key.toLowerCase() === "c") {
    world.clear();
  }

  if (event.key.toLowerCase() === "r") {
    buildDemoScene();
  }
});

buildMaterialButtons();
buildDemoScene();
render();
updateHud();
requestAnimationFrame(tick);
