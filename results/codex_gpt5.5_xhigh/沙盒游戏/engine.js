(function attachFallingSand(global) {
  "use strict";

  const STATE_LABELS = {
    empty: "空",
    solid: "固体",
    powder: "粉体",
    liquid: "液体",
    gas: "气体",
  };

  const MATERIALS = [
    {
      id: 0,
      key: "empty",
      name: "橡皮",
      state: "empty",
      density: 0,
      baseTemp: 20,
      conductivity: 0.02,
      colors: ["#050707"],
    },
    {
      id: 1,
      key: "sand",
      name: "沙子",
      state: "powder",
      density: 5.1,
      baseTemp: 22,
      conductivity: 0.08,
      colors: ["#d7b56d", "#c89b4f", "#e2c77f", "#b88942"],
      acidResistance: 0.45,
    },
    {
      id: 2,
      key: "water",
      name: "水",
      state: "liquid",
      density: 1,
      baseTemp: 18,
      conductivity: 0.35,
      fluidity: 7,
      colors: ["#2d8bd2", "#1f72b9", "#43a3e8", "#226a9c"],
      acidResistance: 1,
    },
    {
      id: 3,
      key: "stone",
      name: "石头",
      state: "solid",
      density: 8.5,
      baseTemp: 20,
      conductivity: 0.14,
      colors: ["#7d8380", "#666d6a", "#969d99", "#565e5b"],
      acidResistance: 0.95,
    },
    {
      id: 4,
      key: "wood",
      name: "木头",
      state: "solid",
      density: 3.2,
      baseTemp: 22,
      conductivity: 0.06,
      colors: ["#8f623c", "#70492e", "#aa7948", "#5a3927"],
      flammable: true,
      burnTemp: 240,
      fuel: 85,
      acidResistance: 0.24,
    },
    {
      id: 5,
      key: "fire",
      name: "火",
      state: "gas",
      density: -1.35,
      baseTemp: 650,
      conductivity: 0.7,
      fluidity: 3,
      colors: ["#ffd166", "#ff8c42", "#ff4f32", "#fff2a8"],
      defaultLife: 26,
      paintLife: 36,
      acidResistance: 1,
    },
    {
      id: 6,
      key: "smoke",
      name: "烟",
      state: "gas",
      density: -0.35,
      baseTemp: 75,
      conductivity: 0.08,
      fluidity: 5,
      colors: ["#6c7472", "#555f5d", "#828a88", "#434b49"],
      defaultLife: 180,
      paintLife: 220,
      acidResistance: 1,
    },
    {
      id: 7,
      key: "oil",
      name: "油",
      state: "liquid",
      density: 0.78,
      baseTemp: 24,
      conductivity: 0.08,
      fluidity: 6,
      colors: ["#5f5125", "#75622d", "#3f3b1d", "#8a7436"],
      flammable: true,
      burnTemp: 180,
      fuel: 95,
      acidResistance: 0.7,
    },
    {
      id: 8,
      key: "lava",
      name: "岩浆",
      state: "liquid",
      density: 6.2,
      baseTemp: 780,
      conductivity: 0.85,
      fluidity: 3,
      colors: ["#ff5a28", "#f23a1b", "#ffb141", "#812510"],
      acidResistance: 1,
    },
    {
      id: 9,
      key: "acid",
      name: "酸",
      state: "liquid",
      density: 1.15,
      baseTemp: 22,
      conductivity: 0.25,
      fluidity: 6,
      colors: ["#89e84d", "#64cc34", "#b0ff66", "#3ca51e"],
      defaultLife: 360,
      paintLife: 420,
      acidResistance: 1,
    },
    {
      id: 10,
      key: "ice",
      name: "冰",
      state: "solid",
      density: 0.92,
      baseTemp: -12,
      conductivity: 0.28,
      colors: ["#a9e5ff", "#7ec9f4", "#d5f5ff", "#80bde3"],
      acidResistance: 0.55,
    },
    {
      id: 11,
      key: "steam",
      name: "蒸汽",
      state: "gas",
      density: -0.85,
      baseTemp: 120,
      conductivity: 0.22,
      fluidity: 5,
      colors: ["#cad7d5", "#edf4f2", "#aebdba", "#dde8e6"],
      defaultLife: 170,
      paintLife: 220,
      acidResistance: 1,
    },
    {
      id: 12,
      key: "plant",
      name: "植物",
      state: "solid",
      density: 1.7,
      baseTemp: 22,
      conductivity: 0.09,
      colors: ["#2fa66c", "#238451", "#51c981", "#1b643f"],
      flammable: true,
      burnTemp: 165,
      fuel: 46,
      acidResistance: 0.12,
    },
    {
      id: 13,
      key: "salt",
      name: "盐",
      state: "powder",
      density: 5.3,
      baseTemp: 22,
      conductivity: 0.16,
      colors: ["#f3f0dc", "#dcd5bd", "#fffbe8", "#c7c0aa"],
      acidResistance: 0.5,
    },
    {
      id: 14,
      key: "metal",
      name: "金属",
      state: "solid",
      density: 9.4,
      baseTemp: 20,
      conductivity: 1,
      colors: ["#aeb7b4", "#858f8d", "#d4ddda", "#68716f"],
      acidResistance: 0.76,
    },
  ];

  const ID = Object.fromEntries(MATERIALS.map((material) => [material.key, material.id]));
  const AMBIENT_TEMP = 20;
  const EMPTY = ID.empty;
  const CARDINALS = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const NEIGHBORS = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];

  class FallingSandWorld {
    constructor(options) {
      const config = options || {};
      this.tick = 0;
      this.resize(config.cols || 180, config.rows || 120);
    }

    resize(cols, rows) {
      this.cols = Math.max(32, Math.floor(cols));
      this.rows = Math.max(32, Math.floor(rows));
      this.size = this.cols * this.rows;
      this.cells = new Uint8Array(this.size);
      this.moved = new Uint16Array(this.size);
      this.life = new Int16Array(this.size);
      this.heat = new Float32Array(this.size);
      this.seed = new Uint8Array(this.size);
      for (let i = 0; i < this.size; i += 1) {
        this.heat[i] = AMBIENT_TEMP;
        this.seed[i] = (i * 73 + (i >> 2) * 37) & 255;
      }
    }

    clear() {
      this.cells.fill(EMPTY);
      this.moved.fill(0);
      this.life.fill(0);
      this.heat.fill(AMBIENT_TEMP);
    }

    countParticles() {
      let count = 0;
      for (let i = 0; i < this.size; i += 1) {
        if (this.cells[i] !== EMPTY) count += 1;
      }
      return count;
    }

    index(x, y) {
      return y * this.cols + x;
    }

    inBounds(x, y) {
      return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    }

    materialAt(x, y) {
      if (!this.inBounds(x, y)) return MATERIALS[ID.stone];
      return MATERIALS[this.cells[this.index(x, y)]];
    }

    sample(x, y) {
      if (!this.inBounds(x, y)) {
        return {
          id: ID.stone,
          material: MATERIALS[ID.stone],
          temp: AMBIENT_TEMP,
          life: 0,
        };
      }
      const i = this.index(x, y);
      return {
        id: this.cells[i],
        material: MATERIALS[this.cells[i]],
        temp: this.heat[i],
        life: this.life[i],
      };
    }

    setCell(x, y, id, temp, life) {
      if (!this.inBounds(x, y)) return false;
      const i = this.index(x, y);
      this.setIndex(i, id, temp, life);
      return true;
    }

    setIndex(i, id, temp, life) {
      const material = MATERIALS[id] || MATERIALS[EMPTY];
      this.cells[i] = material.id;
      this.heat[i] = temp === undefined ? material.baseTemp : temp;
      this.life[i] = life === undefined ? material.defaultLife || 0 : life;
      this.seed[i] = ((this.seed[i] * 166 + 101 + this.tick) & 255) || 1;
    }

    eraseIndex(i) {
      this.cells[i] = EMPTY;
      this.life[i] = 0;
      this.heat[i] = AMBIENT_TEMP;
    }

    paint(x, y, radius, materialId, shape) {
      const id = materialId === undefined ? ID.sand : materialId;
      const brush = shape || "circle";
      const r = Math.max(1, Math.floor(radius));
      const limit = r * r;
      const density = brush === "spray" ? 0.38 : 1;
      let placed = 0;

      for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          const isSquare = brush === "square";
          if (!isSquare && dx * dx + dy * dy > limit) continue;
          if (brush === "spray" && Math.random() > density) continue;

          const px = x + dx;
          const py = y + dy;
          if (!this.inBounds(px, py)) continue;

          const i = this.index(px, py);
          if (id === EMPTY) {
            this.eraseIndex(i);
          } else {
            const material = MATERIALS[id];
            this.setIndex(i, id, material.baseTemp, material.paintLife || material.defaultLife || 0);
          }
          placed += 1;
        }
      }

      return placed;
    }

    cool(amount) {
      const strength = Math.max(0.02, amount || 0.18);
      for (let i = 0; i < this.size; i += 1) {
        this.heat[i] += (AMBIENT_TEMP - this.heat[i]) * strength;
      }
    }

    step(iterations) {
      const loops = Math.max(1, Math.floor(iterations || 1));
      for (let i = 0; i < loops; i += 1) {
        this.stepOnce();
      }
    }

    stepOnce() {
      this.tick = (this.tick + 1) & 65535;
      if (this.tick === 0) this.tick = 1;
      this.moved.fill(0);
      this.diffuseHeat();

      const leftToRight = Math.random() > 0.5;
      for (let y = this.rows - 1; y >= 0; y -= 1) {
        for (let sx = 0; sx < this.cols; sx += 1) {
          const x = leftToRight ? sx : this.cols - 1 - sx;
          const i = this.index(x, y);
          if (this.cells[i] === EMPTY || this.moved[i] === this.tick) continue;
          this.updateCell(x, y, i);
        }
      }
    }

    diffuseHeat() {
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const i = this.index(x, y);
          const id = this.cells[i];
          const material = MATERIALS[id];
          if (id === EMPTY) {
            this.heat[i] += (AMBIENT_TEMP - this.heat[i]) * 0.04;
          } else if (id !== ID.lava && id !== ID.fire) {
            this.heat[i] += (AMBIENT_TEMP - this.heat[i]) * 0.003;
          }

          if (x + 1 < this.cols) this.exchangeHeat(i, i + 1);
          if (y + 1 < this.rows) this.exchangeHeat(i, i + this.cols);

          if (material.key === "lava") this.heat[i] = Math.max(this.heat[i] - 0.08, 430);
          if (material.key === "fire") this.heat[i] = Math.max(this.heat[i], 520);
        }
      }
    }

    exchangeHeat(a, b) {
      const matA = MATERIALS[this.cells[a]];
      const matB = MATERIALS[this.cells[b]];
      const conduct = Math.min(1, (matA.conductivity + matB.conductivity) * 0.5);
      const delta = (this.heat[b] - this.heat[a]) * conduct * 0.03;
      this.heat[a] += delta;
      this.heat[b] -= delta;
    }

    updateCell(x, y, i) {
      this.applyReactions(x, y, i);
      const id = this.cells[i];
      if (id === EMPTY || this.moved[i] === this.tick) return;
      const material = MATERIALS[id];

      if (material.state === "powder") {
        this.movePowder(x, y, i);
      } else if (material.state === "liquid") {
        this.moveLiquid(x, y, i);
      } else if (material.state === "gas") {
        this.moveGas(x, y, i);
      } else {
        this.moved[i] = this.tick;
      }
    }

    applyReactions(x, y, i) {
      const id = this.cells[i];
      const material = MATERIALS[id];
      const temp = this.heat[i];

      if (id === ID.water) {
        if (temp >= 105) {
          this.setIndex(i, ID.steam, Math.max(118, temp), 180);
          return;
        }
        if (temp <= -5) {
          this.setIndex(i, ID.ice, Math.min(-8, temp));
          return;
        }
      }

      if (id === ID.ice && temp > 2) {
        this.setIndex(i, ID.water, Math.max(1, temp));
        return;
      }

      if (id === ID.steam) {
        this.life[i] -= 1;
        if (temp < 92 || this.life[i] <= 0) {
          this.setIndex(i, ID.water, Math.min(88, temp));
          return;
        }
      }

      if (id === ID.smoke) {
        this.life[i] -= 1;
        if (this.life[i] <= 0 || (y < this.rows * 0.18 && Math.random() < 0.02)) {
          this.eraseIndex(i);
          return;
        }
      }

      if (id === ID.fire) {
        this.life[i] -= 1;
        this.heatAround(x, y, 26);
        this.igniteAround(x, y);
        if (this.life[i] <= 0) {
          if (Math.random() < 0.55) this.setIndex(i, ID.smoke, 80, 150);
          else this.eraseIndex(i);
          return;
        }
      }

      if (id === ID.lava) {
        this.heatAround(x, y, 36);
        if (this.reactLava(x, y, i)) return;
        if (temp < 455) {
          this.setIndex(i, ID.stone, temp);
          return;
        }
        this.igniteAround(x, y);
      }

      if (id === ID.acid) {
        this.life[i] -= 1;
        if (this.reactAcid(x, y, i)) return;
        if (this.life[i] <= 0) {
          this.setIndex(i, ID.water, this.heat[i]);
          return;
        }
      }

      if (id === ID.salt && this.touching(x, y, ID.water)) {
        if (Math.random() < 0.34) {
          this.setIndex(i, ID.water, this.heat[i]);
          return;
        }
      }

      if (id === ID.plant) {
        if (temp > 62 && Math.random() < 0.08) {
          this.setIndex(i, ID.fire, 520, 28);
          return;
        }
        this.growPlant(x, y);
      }

      if (material.flammable && id !== ID.fire) {
        const hotEnough = temp >= material.burnTemp;
        if (hotEnough || this.touching(x, y, ID.fire) || this.touching(x, y, ID.lava)) {
          const chance = id === ID.oil ? 0.28 : 0.08;
          if (Math.random() < chance) {
            this.setIndex(i, ID.fire, 580, material.fuel || 34);
          }
        }
      }

      if (id === ID.oil && temp > 215 && Math.random() < 0.18) {
        this.setIndex(i, ID.fire, 590, 82);
      }
    }

    heatAround(x, y, amount) {
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const ni = this.index(nx, ny);
        this.heat[ni] += amount * (0.45 + Math.random() * 0.35);
      }
    }

    igniteAround(x, y) {
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const ni = this.index(nx, ny);
        const target = MATERIALS[this.cells[ni]];
        if (!target.flammable) continue;
        this.heat[ni] += 22;
        if (this.heat[ni] > target.burnTemp && Math.random() < 0.16) {
          this.setIndex(ni, ID.fire, 590, target.fuel || 35);
        }
      }
    }

    reactLava(x, y, i) {
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const ni = this.index(nx, ny);
        const targetId = this.cells[ni];
        if (targetId === ID.water || targetId === ID.ice) {
          this.setIndex(ni, ID.steam, 145, 150);
          if (Math.random() < 0.34) {
            this.setIndex(i, ID.stone, 360);
            return true;
          }
          this.heat[i] -= 80;
        } else if (targetId === ID.sand && this.heat[i] > 680 && Math.random() < 0.02) {
          this.setIndex(ni, ID.lava, this.heat[i] - 60);
        }
      }
      return false;
    }

    reactAcid(x, y, i) {
      const order = shuffledNeighbors();
      for (const [dx, dy] of order) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const ni = this.index(nx, ny);
        const targetId = this.cells[ni];
        const target = MATERIALS[targetId];

        if (
          targetId === EMPTY ||
          targetId === ID.acid ||
          targetId === ID.water ||
          targetId === ID.steam ||
          targetId === ID.smoke ||
          targetId === ID.fire
        ) {
          continue;
        }

        if (targetId === ID.lava) {
          this.setIndex(i, ID.smoke, 95, 80);
          return true;
        }

        const resistance = target.acidResistance === undefined ? 0.5 : target.acidResistance;
        const chance = Math.max(0.01, 0.22 * (1 - resistance));
        if (Math.random() < chance) {
          if (target.flammable && Math.random() < 0.22) this.setIndex(ni, ID.smoke, 70, 120);
          else this.eraseIndex(ni);
          this.life[i] -= 36;
          this.heat[i] += 2;
          return false;
        }
      }
      return false;
    }

    growPlant(x, y) {
      if (!this.touching(x, y, ID.water) || Math.random() > 0.028) return;

      const candidates = [
        [0, -1],
        [-1, 0],
        [1, 0],
        [-1, -1],
        [1, -1],
      ];
      const offset = candidates[(Math.random() * candidates.length) | 0];
      const nx = x + offset[0];
      const ny = y + offset[1];
      if (!this.inBounds(nx, ny)) return;

      const ni = this.index(nx, ny);
      if (this.cells[ni] === EMPTY || this.cells[ni] === ID.smoke || this.cells[ni] === ID.steam) {
        this.setIndex(ni, ID.plant, this.heat[i]);
        this.moved[ni] = this.tick;
        this.consumeNearbyWater(x, y);
      }
    }

    consumeNearbyWater(x, y) {
      for (const [dx, dy] of CARDINALS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const ni = this.index(nx, ny);
        if (this.cells[ni] === ID.water && Math.random() < 0.28) {
          this.eraseIndex(ni);
          return;
        }
      }
    }

    touching(x, y, targetId) {
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        if (this.cells[this.index(nx, ny)] === targetId) return true;
      }
      return false;
    }

    movePowder(x, y, i) {
      const dirs = Math.random() > 0.5 ? [-1, 1] : [1, -1];
      if (this.tryMove(x, y, x, y + 1)) return true;
      if (this.tryMove(x, y, x + dirs[0], y + 1)) return true;
      if (this.tryMove(x, y, x + dirs[1], y + 1)) return true;
      this.moved[i] = this.tick;
      return false;
    }

    moveLiquid(x, y, i) {
      const material = MATERIALS[this.cells[i]];
      const dir = Math.random() > 0.5 ? 1 : -1;
      const spread = material.fluidity || 4;

      if (this.tryMove(x, y, x, y + 1)) return true;
      if (this.tryMove(x, y, x + dir, y + 1)) return true;
      if (this.tryMove(x, y, x - dir, y + 1)) return true;

      for (let step = 1; step <= spread; step += 1) {
        if (this.tryMove(x, y, x + dir * step, y)) return true;
        if (Math.random() < 0.38 && this.tryMove(x, y, x - dir * step, y)) return true;
      }

      this.moved[i] = this.tick;
      return false;
    }

    moveGas(x, y, i) {
      const material = MATERIALS[this.cells[i]];
      const dir = Math.random() > 0.5 ? 1 : -1;
      const spread = material.fluidity || 4;

      if (this.tryMove(x, y, x, y - 1)) return true;
      if (this.tryMove(x, y, x + dir, y - 1)) return true;
      if (this.tryMove(x, y, x - dir, y - 1)) return true;

      for (let step = 1; step <= spread; step += 1) {
        if (this.tryMove(x, y, x + dir * step, y)) return true;
        if (Math.random() < 0.45 && this.tryMove(x, y, x - dir * step, y)) return true;
      }

      this.moved[i] = this.tick;
      return false;
    }

    tryMove(x1, y1, x2, y2) {
      if (!this.inBounds(x2, y2)) return false;
      const from = this.index(x1, y1);
      const to = this.index(x2, y2);
      if (this.moved[to] === this.tick) return false;

      const srcId = this.cells[from];
      const dstId = this.cells[to];
      if (!this.canDisplace(srcId, dstId)) return false;

      this.swap(from, to);
      this.moved[to] = this.tick;
      this.moved[from] = this.tick;
      return true;
    }

    canDisplace(srcId, dstId) {
      if (dstId === EMPTY) return true;
      const src = MATERIALS[srcId];
      const dst = MATERIALS[dstId];
      if (dst.state === "solid" || dst.state === "powder") return false;
      if (src.state === "gas") {
        return dst.state === "gas" && src.density < dst.density - 0.04;
      }
      if (src.state === "liquid" || src.state === "powder") {
        if (dst.state === "gas") return true;
        if (dst.state === "liquid") return src.density > dst.density + 0.04;
      }
      return false;
    }

    swap(a, b) {
      let temp = this.cells[a];
      this.cells[a] = this.cells[b];
      this.cells[b] = temp;

      temp = this.heat[a];
      this.heat[a] = this.heat[b];
      this.heat[b] = temp;

      temp = this.life[a];
      this.life[a] = this.life[b];
      this.life[b] = temp;

      temp = this.seed[a];
      this.seed[a] = this.seed[b];
      this.seed[b] = temp;
    }
  }

  function shuffledNeighbors() {
    const copy = NEIGHBORS.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = (Math.random() * (i + 1)) | 0;
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  global.FallingSandEngine = {
    AMBIENT_TEMP,
    ID,
    MATERIALS,
    STATE_LABELS,
    FallingSandWorld,
  };
})(window);
