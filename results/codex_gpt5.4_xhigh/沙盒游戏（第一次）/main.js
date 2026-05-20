const GRID_WIDTH = 180;
const GRID_HEIGHT = 108;
const AMBIENT_TEMP = 22;

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const STONE = 3;
const WOOD = 4;
const FIRE = 5;
const STEAM = 6;
const LAVA = 7;
const ACID = 8;
const OIL = 9;
const SMOKE = 10;

const TOOL_IDS = [SAND, WATER, STONE, WOOD, FIRE, STEAM, LAVA, ACID, OIL, EMPTY];
const CARDINALS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const MATERIALS = [
  {
    id: EMPTY,
    key: "erase",
    name: "橡皮",
    state: "void",
    density: -Infinity,
    description: "清除材质",
    baseTemp: AMBIENT_TEMP,
    cooling: 1,
    transfer: 0,
    tones: ["#2f4047", "#111b20", "#061117"],
    render: [
      [47, 64, 71],
      [17, 27, 32],
      [6, 17, 23],
    ],
  },
  {
    id: SAND,
    key: "sand",
    name: "砂",
    state: "powder",
    density: 12,
    description: "沉降迅速，可穿过水和蒸汽",
    baseTemp: 24,
    cooling: 0.04,
    transfer: 0.05,
    tones: ["#f1cf86", "#d6a64e", "#755127"],
    render: [
      [241, 207, 134],
      [214, 166, 78],
      [117, 81, 39],
    ],
  },
  {
    id: WATER,
    key: "water",
    name: "水",
    state: "liquid",
    density: 5,
    description: "可扩散流动，受热会蒸发",
    baseTemp: 18,
    cooling: 0.05,
    transfer: 0.18,
    dispersion: 4,
    tones: ["#92ddff", "#2f9ee2", "#11446a"],
    render: [
      [146, 221, 255],
      [47, 158, 226],
      [17, 68, 106],
    ],
  },
  {
    id: STONE,
    key: "stone",
    name: "石",
    state: "solid",
    density: 20,
    description: "稳定地基，耐热但会缓慢导温",
    baseTemp: AMBIENT_TEMP,
    cooling: 0.018,
    transfer: 0.08,
    acidResistance: 0.88,
    tones: ["#d7dde0", "#7c8f9d", "#364952"],
    render: [
      [215, 221, 224],
      [124, 143, 157],
      [54, 73, 82],
    ],
  },
  {
    id: WOOD,
    key: "wood",
    name: "木",
    state: "solid",
    density: 7,
    description: "结构材料，升温后易燃",
    baseTemp: AMBIENT_TEMP,
    cooling: 0.03,
    transfer: 0.05,
    ignition: 0.05,
    acidResistance: 0.18,
    tones: ["#da9b6b", "#8e552c", "#4f2e16"],
    render: [
      [218, 155, 107],
      [142, 85, 44],
      [79, 46, 22],
    ],
  },
  {
    id: FIRE,
    key: "fire",
    name: "火",
    state: "plasma",
    density: 0.2,
    description: "快速上浮，点燃周围材料",
    baseTemp: 500,
    cooling: 0.02,
    transfer: 0.22,
    life: 24,
    tones: ["#fff4a2", "#ff8c34", "#7a1600"],
    render: [
      [255, 244, 162],
      [255, 140, 52],
      [122, 22, 0],
    ],
  },
  {
    id: STEAM,
    key: "steam",
    name: "蒸汽",
    state: "gas",
    density: 0.36,
    description: "高温气体，逐渐冷凝",
    baseTemp: 135,
    cooling: 0.055,
    transfer: 0.18,
    life: 150,
    dispersion: 6,
    tones: ["#f6f6f6", "#b8d4e3", "#708b97"],
    render: [
      [246, 246, 246],
      [184, 212, 227],
      [112, 139, 151],
    ],
  },
  {
    id: LAVA,
    key: "lava",
    name: "熔岩",
    state: "liquid",
    density: 10,
    description: "高温重液，遇水会汽化并冷却",
    baseTemp: 940,
    cooling: 0.012,
    transfer: 0.24,
    dispersion: 2,
    tones: ["#ffe37b", "#ff5d1a", "#590000"],
    render: [
      [255, 227, 123],
      [255, 93, 26],
      [89, 0, 0],
    ],
  },
  {
    id: ACID,
    key: "acid",
    name: "酸",
    state: "liquid",
    density: 6,
    description: "腐蚀大部分固体并逐渐耗散",
    baseTemp: 28,
    cooling: 0.045,
    transfer: 0.12,
    life: 360,
    dispersion: 4,
    tones: ["#d9ff8b", "#58d964", "#164f28"],
    render: [
      [217, 255, 139],
      [88, 217, 100],
      [22, 79, 40],
    ],
  },
  {
    id: OIL,
    key: "oil",
    name: "油",
    state: "liquid",
    density: 3,
    description: "比水轻，会漂浮且极易燃",
    baseTemp: 24,
    cooling: 0.04,
    transfer: 0.06,
    dispersion: 5,
    ignition: 0.08,
    acidResistance: 0.65,
    tones: ["#f6d37a", "#9f6b14", "#38270a"],
    render: [
      [246, 211, 122],
      [159, 107, 20],
      [56, 39, 10],
    ],
  },
  {
    id: SMOKE,
    key: "smoke",
    name: "烟",
    state: "gas",
    density: 0.56,
    description: "燃烧残留，会缓慢消散",
    baseTemp: 60,
    cooling: 0.05,
    transfer: 0.08,
    life: 180,
    dispersion: 7,
    tones: ["#c7c8d0", "#6d7387", "#21262e"],
    render: [
      [199, 200, 208],
      [109, 115, 135],
      [33, 38, 46],
    ],
  },
];

const MATERIAL_LOOKUP = [];
for (const material of MATERIALS) {
  MATERIAL_LOOKUP[material.id] = material;
}

class SandPhysicsEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height;
    this.cells = new Uint8Array(this.size);
    this.temperature = new Float32Array(this.size);
    this.life = new Int16Array(this.size);
    this.seed = new Uint16Array(this.size);
    this.updated = new Uint32Array(this.size);
    this.frame = 0;
    this.flip = false;
    this.stats = {
      particleCount: 0,
      avgTemp: 0,
      fireCount: 0,
    };

    this.clear();
  }

  clear() {
    this.cells.fill(EMPTY);
    this.temperature.fill(AMBIENT_TEMP);
    this.life.fill(0);
    this.seed.fill(0);
    this.updated.fill(0);
    this.frame = 0;
    this.flip = false;
    this.calculateStats();
  }

  index(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  defaultLife(id) {
    const material = MATERIAL_LOOKUP[id];
    if (!material || !material.life) {
      return 0;
    }
    const variance = Math.max(1, Math.floor(material.life * 0.18));
    return material.life + Math.floor((Math.random() * variance * 2) - variance);
  }

  setCellByIndex(index, id, options = {}) {
    const material = MATERIAL_LOOKUP[id];
    this.cells[index] = id;
    this.seed[index] = options.keepSeed ? this.seed[index] : Math.floor(Math.random() * 65535);

    if (id === EMPTY) {
      this.temperature[index] = AMBIENT_TEMP;
      this.life[index] = 0;
      this.seed[index] = 0;
      return;
    }

    this.temperature[index] = options.temp !== undefined ? options.temp : (
      material.baseTemp !== undefined ? material.baseTemp : AMBIENT_TEMP
    );
    this.life[index] = options.life !== undefined ? options.life : this.defaultLife(id);

    if (options.markUpdated) {
      this.updated[index] = this.frame;
    }
  }

  setCell(x, y, id, options) {
    if (!this.inBounds(x, y)) {
      return;
    }
    this.setCellByIndex(this.index(x, y), id, options);
  }

  swapCells(a, b) {
    const cellA = this.cells[a];
    const cellB = this.cells[b];
    const tempA = this.temperature[a];
    const tempB = this.temperature[b];
    const lifeA = this.life[a];
    const lifeB = this.life[b];
    const seedA = this.seed[a];
    const seedB = this.seed[b];

    this.cells[a] = cellB;
    this.cells[b] = cellA;
    this.temperature[a] = tempB;
    this.temperature[b] = tempA;
    this.life[a] = lifeB;
    this.life[b] = lifeA;
    this.seed[a] = seedB;
    this.seed[b] = seedA;
    this.updated[a] = this.frame;
    this.updated[b] = this.frame;
  }

  paintCircle(cx, cy, radius, id) {
    const brushRadius = Math.max(1, radius);
    const radiusSq = brushRadius * brushRadius;

    for (let y = cy - brushRadius; y <= cy + brushRadius; y += 1) {
      if (y < 0 || y >= this.height) {
        continue;
      }

      for (let x = cx - brushRadius; x <= cx + brushRadius; x += 1) {
        if (x < 0 || x >= this.width) {
          continue;
        }

        const dx = x - cx;
        const dy = y - cy;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq > radiusSq) {
          continue;
        }

        if (id !== EMPTY && distanceSq > radiusSq * 0.72 && Math.random() < 0.26) {
          continue;
        }

        this.setCell(x, y, id);
      }
    }
  }

  fillRect(x, y, width, height, id) {
    for (let offsetY = 0; offsetY < height; offsetY += 1) {
      for (let offsetX = 0; offsetX < width; offsetX += 1) {
        this.setCell(x + offsetX, y + offsetY, id);
      }
    }
  }

  drawDisc(cx, cy, radius, id) {
    this.paintCircle(cx, cy, radius, id);
  }

  carveBasin() {
    this.fillRect(0, this.height - 8, this.width, 8, STONE);

    for (let y = this.height - 34; y < this.height - 8; y += 1) {
      const inset = Math.max(0, 10 - Math.floor((this.height - y) * 0.4));
      this.fillRect(0, y, 4 + inset, 1, STONE);
      this.fillRect(this.width - 4 - inset, y, 4 + inset, 1, STONE);
    }
  }

  loadPreset(name) {
    this.clear();
    this.carveBasin();

    if (name === "volcano") {
      this.loadVolcanoPreset();
    } else if (name === "lab") {
      this.loadLabPreset();
    } else {
      this.loadDunesPreset();
    }

    this.calculateStats();
  }

  loadDunesPreset() {
    this.fillRect(12, this.height - 28, 44, 18, WATER);
    this.fillRect(126, this.height - 24, 30, 10, OIL);
    this.fillRect(102, this.height - 20, 54, 10, WATER);

    for (let x = 42; x <= 138; x += 10) {
      this.drawDisc(x, 34 + ((x * 17) % 9), 8, SAND);
    }

    this.drawDisc(80, 48, 14, SAND);
    this.drawDisc(98, 24, 6, FIRE);
    this.fillRect(132, this.height - 40, 10, 4, WOOD);
  }

  loadVolcanoPreset() {
    for (let x = 34; x <= 146; x += 8) {
      const ridgeHeight = Math.floor(18 + Math.abs(90 - x) * 0.22);
      this.fillRect(x, this.height - ridgeHeight, 6, ridgeHeight - 8, STONE);
    }

    this.fillRect(70, this.height - 24, 40, 8, LAVA);
    this.fillRect(72, this.height - 36, 36, 6, LAVA);
    this.fillRect(18, this.height - 26, 26, 16, WATER);
    this.drawDisc(90, 26, 6, FIRE);
    this.fillRect(124, this.height - 28, 18, 12, WOOD);
  }

  loadLabPreset() {
    this.fillRect(26, this.height - 56, 4, 48, STONE);
    this.fillRect(78, this.height - 48, 4, 40, STONE);
    this.fillRect(128, this.height - 60, 4, 52, STONE);
    this.fillRect(12, this.height - 56, 20, 4, STONE);
    this.fillRect(64, this.height - 48, 20, 4, STONE);
    this.fillRect(114, this.height - 60, 20, 4, STONE);

    this.fillRect(8, this.height - 24, 18, 12, WATER);
    this.fillRect(48, this.height - 18, 24, 8, ACID);
    this.fillRect(92, this.height - 20, 20, 10, OIL);
    this.fillRect(136, this.height - 22, 18, 10, WATER);
    this.fillRect(142, this.height - 34, 12, 6, FIRE);
    this.fillRect(86, this.height - 34, 22, 4, WOOD);
    this.fillRect(42, this.height - 38, 28, 3, WOOD);
  }

  step(steps = 1) {
    for (let count = 0; count < steps; count += 1) {
      this.stepOnce();
    }
  }

  stepOnce() {
    this.frame += 1;
    this.applyThermalPass();
    this.applyReactionPass();
    this.updateDensePass();
    this.updateLightPass();
    this.flip = !this.flip;

    if (this.frame % 4 === 0) {
      this.calculateStats();
    }
  }

  applyThermalPass() {
    for (let index = 0; index < this.size; index += 1) {
      const id = this.cells[index];
      if (id === EMPTY) {
        continue;
      }

      const material = MATERIAL_LOOKUP[id];
      const baseTemp = material.baseTemp !== undefined ? material.baseTemp : AMBIENT_TEMP;
      const cooling = material.cooling !== undefined ? material.cooling : 0.04;
      const relaxedTemp = this.temperature[index] + (baseTemp - this.temperature[index]) * cooling;
      this.temperature[index] = Math.max(-20, Math.min(1600, relaxedTemp));

      const x = index % this.width;
      const y = Math.floor(index / this.width);
      const direction = (this.seed[index] + this.frame + index) & 3;
      const [dx, dy] = CARDINALS[direction];
      const nx = x + dx;
      const ny = y + dy;

      if (!this.inBounds(nx, ny)) {
        continue;
      }

      const neighborIndex = this.index(nx, ny);
      const neighborId = this.cells[neighborIndex];
      if (neighborId === EMPTY) {
        continue;
      }

      const neighborMaterial = MATERIAL_LOOKUP[neighborId];
      const transfer = (material.transfer + neighborMaterial.transfer) * 0.12;
      const delta = (this.temperature[index] - this.temperature[neighborIndex]) * transfer;
      this.temperature[index] -= delta;
      this.temperature[neighborIndex] += delta;
    }
  }

  applyReactionPass() {
    for (let index = 0; index < this.size; index += 1) {
      const id = this.cells[index];
      if (id === EMPTY) {
        continue;
      }

      if (id === WATER) {
        if (this.temperature[index] > 112) {
          this.setCellByIndex(index, STEAM, { temp: this.temperature[index] + 12 });
        }
        continue;
      }

      if (id === STEAM) {
        this.life[index] -= 1;
        if (this.temperature[index] < 88 || this.life[index] <= 0) {
          if (Math.random() < 0.12) {
            this.setCellByIndex(index, WATER, { temp: 68 });
          }
        }
        continue;
      }

      if (id === SMOKE) {
        this.life[index] -= 1;
        if (this.life[index] <= 0) {
          this.setCellByIndex(index, EMPTY);
        }
        continue;
      }

      if (id === FIRE) {
        this.handleFire(index);
        continue;
      }

      if (id === LAVA) {
        this.handleLava(index);
        continue;
      }

      if (id === ACID) {
        this.handleAcid(index);
        continue;
      }

      if (id === WOOD || id === OIL) {
        const material = MATERIAL_LOOKUP[id];
        if (this.temperature[index] > 230 && Math.random() < material.ignition) {
          this.setCellByIndex(index, FIRE, { temp: Math.max(320, this.temperature[index]) });
        }
      }

      if (id === SAND && this.temperature[index] > 980 && Math.random() < 0.01) {
        this.setCellByIndex(index, STONE, { temp: 260 });
      }
    }
  }

  handleFire(index) {
    this.life[index] -= 1;
    let extinguishPower = 0;
    const x = index % this.width;
    const y = Math.floor(index / this.width);

    this.forEachCardinalNeighbor(x, y, (neighborIndex, neighborId) => {
      if (neighborId === WATER) {
        this.setCellByIndex(neighborIndex, STEAM, { temp: 148 });
        extinguishPower += 7;
        return;
      }

      if (neighborId === WOOD || neighborId === OIL) {
        this.temperature[neighborIndex] += 90;
        if (Math.random() < 0.18) {
          this.setCellByIndex(neighborIndex, FIRE, {
            temp: Math.max(this.temperature[neighborIndex], 340),
          });
        }
        return;
      }

      if (neighborId === SAND) {
        this.temperature[neighborIndex] += 10;
        return;
      }

      if (neighborId === ACID) {
        this.temperature[neighborIndex] += 12;
      }
    });

    this.temperature[index] = Math.max(280, this.temperature[index] - extinguishPower * 6);
    this.life[index] -= extinguishPower;

    if (this.life[index] <= 0) {
      this.setCellByIndex(index, Math.random() < 0.7 ? SMOKE : EMPTY, { temp: 80 });
    }
  }

  handleLava(index) {
    const x = index % this.width;
    const y = Math.floor(index / this.width);

    this.forEachCardinalNeighbor(x, y, (neighborIndex, neighborId) => {
      if (neighborId === WATER) {
        this.setCellByIndex(neighborIndex, STEAM, { temp: 180 });
        this.temperature[index] -= 95;
        return;
      }

      if (neighborId === WOOD || neighborId === OIL) {
        this.temperature[neighborIndex] += 150;
        if (Math.random() < 0.26) {
          this.setCellByIndex(neighborIndex, FIRE, { temp: 420 });
        }
        return;
      }

      if (neighborId === SAND) {
        this.temperature[neighborIndex] += 28;
      }
    });

    if (this.temperature[index] < 420) {
      this.setCellByIndex(index, STONE, { temp: 180 });
    }
  }

  handleAcid(index) {
    if (this.frame % 5 === 0) {
      this.life[index] -= 1;
    }

    const x = index % this.width;
    const y = Math.floor(index / this.width);

    this.forEachCardinalNeighbor(x, y, (neighborIndex, neighborId) => {
      if (neighborId === EMPTY || neighborId === ACID || neighborId === FIRE || neighborId === STEAM || neighborId === SMOKE) {
        return;
      }

      const neighborMaterial = MATERIAL_LOOKUP[neighborId];
      const resistance = neighborMaterial.acidResistance !== undefined ? neighborMaterial.acidResistance : 0.35;
      const dissolveChance = 0.028 * (1 - resistance);

      if (Math.random() < dissolveChance) {
        if (neighborId === WATER) {
          this.setCellByIndex(neighborIndex, EMPTY);
        } else {
          this.setCellByIndex(neighborIndex, Math.random() < 0.35 ? SMOKE : EMPTY, { temp: 64 });
        }

        this.life[index] -= 5;
      }
    });

    if (this.life[index] <= 0) {
      this.setCellByIndex(index, EMPTY);
    }
  }

  forEachCardinalNeighbor(x, y, callback) {
    if (y > 0) {
      const up = this.index(x, y - 1);
      callback(up, this.cells[up]);
    }
    if (x < this.width - 1) {
      const right = this.index(x + 1, y);
      callback(right, this.cells[right]);
    }
    if (y < this.height - 1) {
      const down = this.index(x, y + 1);
      callback(down, this.cells[down]);
    }
    if (x > 0) {
      const left = this.index(x - 1, y);
      callback(left, this.cells[left]);
    }
  }

  updateDensePass() {
    for (let y = this.height - 1; y >= 0; y -= 1) {
      const leftToRight = ((y & 1) === 0) === this.flip;

      if (leftToRight) {
        for (let x = 0; x < this.width; x += 1) {
          this.updateDenseCell(x, y);
        }
      } else {
        for (let x = this.width - 1; x >= 0; x -= 1) {
          this.updateDenseCell(x, y);
        }
      }
    }
  }

  updateDenseCell(x, y) {
    const index = this.index(x, y);
    if (this.updated[index] === this.frame) {
      return;
    }

    const id = this.cells[index];
    if (id === EMPTY) {
      return;
    }

    const material = MATERIAL_LOOKUP[id];

    if (material.state === "powder") {
      this.updatePowder(x, y, index, material);
    } else if (material.state === "liquid") {
      this.updateLiquid(x, y, index, material);
    }
  }

  updatePowder(x, y, index, material) {
    if (this.tryMoveDense(index, x, y, 0, 1, material)) {
      return;
    }

    const favorLeft = ((this.seed[index] + this.frame) & 1) === 0;
    const first = favorLeft ? -1 : 1;
    const second = -first;

    if (this.tryMoveDense(index, x, y, first, 1, material)) {
      return;
    }

    this.tryMoveDense(index, x, y, second, 1, material);
  }

  updateLiquid(x, y, index, material) {
    if (this.tryMoveDense(index, x, y, 0, 1, material)) {
      return;
    }

    const favorLeft = ((this.seed[index] + this.frame) & 1) === 0;
    const sides = favorLeft ? [-1, 1] : [1, -1];

    if (this.tryMoveDense(index, x, y, sides[0], 1, material)) {
      return;
    }

    if (this.tryMoveDense(index, x, y, sides[1], 1, material)) {
      return;
    }

    if (this.tryFlowSideways(index, x, y, sides[0], material)) {
      return;
    }

    this.tryFlowSideways(index, x, y, sides[1], material);
  }

  tryFlowSideways(index, x, y, direction, material) {
    const maxDistance = material.dispersion !== undefined ? material.dispersion : 3;

    for (let distance = 1; distance <= maxDistance; distance += 1) {
      const nx = x + direction * distance;
      if (nx < 0 || nx >= this.width) {
        break;
      }

      const neighborIndex = this.index(nx, y);
      const neighborId = this.cells[neighborIndex];

      if (neighborId !== EMPTY && !this.canDenseDisplace(material, MATERIAL_LOOKUP[neighborId])) {
        break;
      }

      const belowIndex = y < this.height - 1 ? neighborIndex + this.width : -1;
      const belowId = belowIndex === -1 ? STONE : this.cells[belowIndex];
      const belowMaterial = MATERIAL_LOOKUP[belowId];
      const belowState = belowMaterial ? belowMaterial.state : undefined;
      const isSupported = belowId !== EMPTY && belowState !== "gas" && belowState !== "plasma" && belowState !== "void";

      if (distance === 1 || isSupported) {
        this.swapCells(index, neighborIndex);
        return true;
      }
    }

    return false;
  }

  tryMoveDense(index, x, y, dx, dy, material) {
    const nx = x + dx;
    const ny = y + dy;

    if (!this.inBounds(nx, ny)) {
      return false;
    }

    const neighborIndex = this.index(nx, ny);
    const neighborId = this.cells[neighborIndex];
    if (neighborId !== EMPTY && !this.canDenseDisplace(material, MATERIAL_LOOKUP[neighborId])) {
      return false;
    }

    this.swapCells(index, neighborIndex);
    return true;
  }

  canDenseDisplace(source, target) {
    if (target.state === "void") {
      return true;
    }

    if (source.state === "powder") {
      return target.state === "liquid" || target.state === "gas" || target.state === "plasma";
    }

    if (source.state === "liquid") {
      return (
        target.state === "gas" ||
        target.state === "plasma" ||
        (target.state === "liquid" && source.density > target.density)
      );
    }

    return false;
  }

  updateLightPass() {
    for (let y = 0; y < this.height; y += 1) {
      const leftToRight = ((y & 1) === 1) === this.flip;

      if (leftToRight) {
        for (let x = 0; x < this.width; x += 1) {
          this.updateLightCell(x, y);
        }
      } else {
        for (let x = this.width - 1; x >= 0; x -= 1) {
          this.updateLightCell(x, y);
        }
      }
    }
  }

  updateLightCell(x, y) {
    const index = this.index(x, y);
    if (this.updated[index] === this.frame) {
      return;
    }

    const id = this.cells[index];
    if (id === EMPTY) {
      return;
    }

    const material = MATERIAL_LOOKUP[id];

    if (material.state === "gas" || material.state === "plasma") {
      this.updateGas(x, y, index, material);
    }
  }

  updateGas(x, y, index, material) {
    if (this.tryMoveLight(index, x, y, 0, -1, material)) {
      return;
    }

    const favorLeft = ((this.seed[index] + this.frame) & 1) === 0;
    const sides = favorLeft ? [-1, 1] : [1, -1];

    if (this.tryMoveLight(index, x, y, sides[0], -1, material)) {
      return;
    }

    if (this.tryMoveLight(index, x, y, sides[1], -1, material)) {
      return;
    }

    if (this.tryDrift(index, x, y, sides[0], material)) {
      return;
    }

    this.tryDrift(index, x, y, sides[1], material);
  }

  tryDrift(index, x, y, direction, material) {
    const maxDistance = material.dispersion !== undefined ? material.dispersion : 4;

    for (let distance = 1; distance <= maxDistance; distance += 1) {
      const nx = x + direction * distance;
      if (nx < 0 || nx >= this.width) {
        break;
      }

      const neighborIndex = this.index(nx, y);
      const neighborId = this.cells[neighborIndex];
      if (neighborId !== EMPTY && !this.canLightDisplace(material, MATERIAL_LOOKUP[neighborId])) {
        break;
      }

      this.swapCells(index, neighborIndex);
      return true;
    }

    return false;
  }

  tryMoveLight(index, x, y, dx, dy, material) {
    const nx = x + dx;
    const ny = y + dy;

    if (!this.inBounds(nx, ny)) {
      return false;
    }

    const neighborIndex = this.index(nx, ny);
    const neighborId = this.cells[neighborIndex];
    if (neighborId !== EMPTY && !this.canLightDisplace(material, MATERIAL_LOOKUP[neighborId])) {
      return false;
    }

    this.swapCells(index, neighborIndex);
    return true;
  }

  canLightDisplace(source, target) {
    if (target.state === "void") {
      return true;
    }

    if (target.state !== "gas" && target.state !== "plasma") {
      return false;
    }

    return source.density < target.density;
  }

  calculateStats() {
    let particleCount = 0;
    let temperatureSum = 0;
    let fireCount = 0;

    for (let index = 0; index < this.size; index += 1) {
      const id = this.cells[index];
      if (id === EMPTY) {
        continue;
      }

      particleCount += 1;
      temperatureSum += this.temperature[index];

      if (id === FIRE || id === LAVA) {
        fireCount += 1;
      }
    }

    this.stats.particleCount = particleCount;
    this.stats.avgTemp = particleCount ? temperatureSum / particleCount : AMBIENT_TEMP;
    this.stats.fireCount = fireCount;
  }
}

class SandRenderer {
  constructor(engine, canvas) {
    this.engine = engine;
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.imageData = this.context.createImageData(engine.width, engine.height);
  }

  render() {
    const pixels = this.imageData.data;
    const { cells, seed, temperature, life, frame, size, width, height } = this.engine;

    for (let index = 0; index < size; index += 1) {
      const id = cells[index];
      const pixelIndex = index * 4;

      let red;
      let green;
      let blue;

      if (id === EMPTY) {
        const y = Math.floor(index / width);
        const depth = y / height;
        red = 8 + depth * 10;
        green = 16 + depth * 16;
        blue = 22 + depth * 18;
      } else {
        const material = MATERIAL_LOOKUP[id];
        const palette = material.render;
        const base = palette[seed[index] % palette.length];
        const variance = ((seed[index] >> 3) & 7) - 3;
        red = base[0] + variance;
        green = base[1] + variance;
        blue = base[2] + variance;

        if (id === FIRE) {
          const flicker = (((seed[index] + frame * 19) % 19) - 9) * 3;
          red = 255;
          green = Math.min(255, base[1] + flicker + 36);
          blue = Math.max(0, base[2] + flicker);
        } else if (id === LAVA) {
          const heat = Math.max(0, (temperature[index] - 360) * 0.06);
          red = Math.min(255, base[0] + heat * 0.35);
          green = Math.min(255, base[1] + heat * 0.1);
          blue = Math.max(0, base[2] - heat * 0.12);
        } else if (id === STEAM) {
          const fade = Math.max(0.5, life[index] / 180);
          red = base[0] * fade + 50;
          green = base[1] * fade + 40;
          blue = base[2] * fade + 28;
        } else if (id === SMOKE) {
          const fade = Math.max(0.3, life[index] / 180);
          red *= fade;
          green *= fade;
          blue *= fade;
        } else if (id === ACID) {
          const pulse = ((seed[index] + frame * 11) % 14) - 7;
          green = Math.min(255, green + pulse * 2 + 18);
        } else if (id === WATER) {
          const shimmer = ((seed[index] + frame * 5) & 7) - 3;
          blue = Math.min(255, blue + shimmer * 2 + 10);
        }
      }

      pixels[pixelIndex] = Math.max(0, Math.min(255, Math.round(red)));
      pixels[pixelIndex + 1] = Math.max(0, Math.min(255, Math.round(green)));
      pixels[pixelIndex + 2] = Math.max(0, Math.min(255, Math.round(blue)));
      pixels[pixelIndex + 3] = 255;
    }

    this.context.putImageData(this.imageData, 0, 0);
  }
}

const canvas = document.querySelector("#sim-canvas");
const materialGrid = document.querySelector("#material-grid");
const brushSizeInput = document.querySelector("#brush-size");
const simSpeedInput = document.querySelector("#sim-speed");
const toggleButton = document.querySelector("#toggle-sim");
const clearButton = document.querySelector("#clear-world");
const presetButtons = Array.from(document.querySelectorAll("[data-preset]"));

const currentMaterialLabel = document.querySelector("#current-material-label");
const brushSizeLabel = document.querySelector("#brush-size-label");
const speedLabel = document.querySelector("#speed-label");
const particleCountLabel = document.querySelector("#particle-count");
const avgTempLabel = document.querySelector("#avg-temp");
const fireCountLabel = document.querySelector("#fire-count");
const simStateLabel = document.querySelector("#sim-state");

const engine = new SandPhysicsEngine(GRID_WIDTH, GRID_HEIGHT);
const renderer = new SandRenderer(engine, canvas);

let activeMaterialId = SAND;
let brushSize = Number(brushSizeInput.value);
let simSpeed = Number(simSpeedInput.value);
let paused = false;
let painting = false;
let lastPaintPoint = null;

function renderMaterialButtons() {
  const fragment = document.createDocumentFragment();

  TOOL_IDS.forEach((id, slotIndex) => {
    const material = MATERIAL_LOOKUP[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material-card";
    button.dataset.materialId = String(id);
    button.dataset.slot = String(slotIndex);
    button.style.setProperty("--tone-1", material.tones[0]);
    button.style.setProperty("--tone-2", material.tones[1]);
    button.style.setProperty("--tone-3", material.tones[2]);

    if (id === activeMaterialId) {
      button.classList.add("is-active");
    }

    const keyLabel = slotIndex === 9 ? "0" : String(slotIndex + 1);
    button.innerHTML = `
      <span class="material-card__swatch" aria-hidden="true"></span>
      <span class="material-card__name">${material.name}</span>
      <span class="material-card__meta">${material.description} · ${keyLabel}</span>
    `;

    button.addEventListener("click", () => {
      activeMaterialId = id;
      updateHud();
      syncMaterialSelection();
    });

    fragment.appendChild(button);
  });

  materialGrid.replaceChildren(fragment);
}

function syncMaterialSelection() {
  const buttons = materialGrid.querySelectorAll(".material-card");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.materialId) === activeMaterialId);
  });
}

function updateHud() {
  currentMaterialLabel.textContent = MATERIAL_LOOKUP[activeMaterialId].name;
  brushSizeLabel.textContent = String(brushSize);
  speedLabel.textContent = `${simSpeed}x`;
  particleCountLabel.textContent = engine.stats.particleCount.toLocaleString("zh-CN");
  avgTempLabel.textContent = `${Math.round(engine.stats.avgTemp)}°C`;
  fireCountLabel.textContent = engine.stats.fireCount.toLocaleString("zh-CN");
  simStateLabel.textContent = paused ? "已暂停" : "运行中";
  toggleButton.textContent = paused ? "继续" : "暂停";
}

function canvasPointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * engine.width);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * engine.height);
  return {
    x: Math.max(0, Math.min(engine.width - 1, x)),
    y: Math.max(0, Math.min(engine.height - 1, y)),
  };
}

function paintStroke(start, end) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, brushSize * 0.45)));

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = Math.round(start.x + (end.x - start.x) * t);
    const y = Math.round(start.y + (end.y - start.y) * t);
    engine.paintCircle(x, y, brushSize, activeMaterialId);
  }

  engine.calculateStats();
}

function beginPaintAtPoint(point) {
  painting = true;
  paintStroke(point, point);
  lastPaintPoint = point;
}

function movePaintToPoint(point) {
  if (!painting) {
    return;
  }

  paintStroke(lastPaintPoint || point, point);
  lastPaintPoint = point;
}

function endPaint() {
  painting = false;
  lastPaintPoint = null;
}

function canvasPointFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((clientX - rect.left) / rect.width) * engine.width);
  const y = Math.floor(((clientY - rect.top) / rect.height) * engine.height);
  return {
    x: Math.max(0, Math.min(engine.width - 1, x)),
    y: Math.max(0, Math.min(engine.height - 1, y)),
  };
}

function handlePointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  if (typeof canvas.setPointerCapture === "function") {
    canvas.setPointerCapture(event.pointerId);
  }

  beginPaintAtPoint(canvasPointFromEvent(event));
}

function handlePointerMove(event) {
  movePaintToPoint(canvasPointFromEvent(event));
}

function handlePointerUp(event) {
  endPaint();

  if (typeof canvas.hasPointerCapture === "function" &&
      typeof canvas.releasePointerCapture === "function" &&
      canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function handleMouseDown(event) {
  if (event.button !== 0) {
    return;
  }

  beginPaintAtPoint(canvasPointFromClient(event.clientX, event.clientY));
}

function handleMouseMove(event) {
  movePaintToPoint(canvasPointFromClient(event.clientX, event.clientY));
}

function handleTouchStart(event) {
  if (!event.touches.length) {
    return;
  }

  event.preventDefault();
  const touch = event.touches[0];
  beginPaintAtPoint(canvasPointFromClient(touch.clientX, touch.clientY));
}

function handleTouchMove(event) {
  if (!event.touches.length) {
    return;
  }

  event.preventDefault();
  const touch = event.touches[0];
  movePaintToPoint(canvasPointFromClient(touch.clientX, touch.clientY));
}

function selectSlotByNumber(key) {
  const slotIndex = key === "0" ? 9 : Number(key) - 1;
  if (slotIndex < 0 || slotIndex >= TOOL_IDS.length) {
    return;
  }

  activeMaterialId = TOOL_IDS[slotIndex];
  syncMaterialSelection();
  updateHud();
}

function animate() {
  if (!paused) {
    engine.step(simSpeed);
  }

  renderer.render();
  updateHud();
  requestAnimationFrame(animate);
}

brushSizeInput.addEventListener("input", () => {
  brushSize = Number(brushSizeInput.value);
  updateHud();
});

simSpeedInput.addEventListener("input", () => {
  simSpeed = Number(simSpeedInput.value);
  updateHud();
});

toggleButton.addEventListener("click", () => {
  paused = !paused;
  updateHud();
});

clearButton.addEventListener("click", () => {
  engine.clear();
  updateHud();
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    engine.loadPreset(button.dataset.preset);
    updateHud();
  });
});

if ("PointerEvent" in window) {
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", endPaint);
  canvas.addEventListener("pointercancel", endPaint);
} else {
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", endPaint);
  canvas.addEventListener("mouseleave", endPaint);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", endPaint);
  canvas.addEventListener("touchcancel", endPaint);
}

window.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLInputElement) {
    return;
  }

  if (/^[0-9]$/.test(event.key)) {
    selectSlotByNumber(event.key);
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    paused = !paused;
    updateHud();
    return;
  }

  if (event.key === "]") {
    brushSize = Math.min(10, brushSize + 1);
    brushSizeInput.value = String(brushSize);
    updateHud();
    return;
  }

  if (event.key === "[") {
    brushSize = Math.max(1, brushSize - 1);
    brushSizeInput.value = String(brushSize);
    updateHud();
  }
});

renderMaterialButtons();
engine.loadPreset("dunes");
syncMaterialSelection();
updateHud();
renderer.render();
requestAnimationFrame(animate);
