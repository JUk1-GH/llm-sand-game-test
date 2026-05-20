/**
 * Falling Sand Simulator — Physics Engine
 * Core simulation grid and particle update logic
 */

class SandEngine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = new Uint8Array(width * height);        // Material type
        this.colorVar = new Uint8Array(width * height);    // Color variation per particle
        this.updated = new Uint8Array(width * height);     // Frame update tracker
        this.lifetime = new Float32Array(width * height);  // Particle lifetime for fire/smoke
        this.temperature = new Float32Array(width * height); // Temperature field
        this.frameCount = 0;
        this.particleCount = 0;

        // Direction alternation prevents bias
        this.directionBias = false;
    }

    /** Get index from coords */
    idx(x, y) {
        return y * this.width + x;
    }

    /** Check bounds */
    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /** Get material at position */
    get(x, y) {
        if (!this.inBounds(x, y)) return -1;
        return this.grid[this.idx(x, y)];
    }

    /** Set material at position */
    set(x, y, material, variation = -1) {
        if (!this.inBounds(x, y)) return;
        const i = this.idx(x, y);
        this.grid[i] = material;
        this.colorVar[i] = variation >= 0 ? variation : Math.floor(Math.random() * 255);
        this.lifetime[i] = 0;
        if (material === MaterialType.FIRE) {
            this.temperature[i] = 800;
            this.lifetime[i] = 60 + Math.random() * 120;
        } else if (material === MaterialType.LAVA) {
            this.temperature[i] = 1200;
        } else if (material === MaterialType.ICE) {
            this.temperature[i] = -20;
        } else if (material === MaterialType.STEAM) {
            this.lifetime[i] = 80 + Math.random() * 120;
        } else if (material === MaterialType.SMOKE) {
            this.lifetime[i] = 60 + Math.random() * 100;
        } else {
            this.temperature[i] = 20;
        }
    }

    /** Clear entire grid */
    clear() {
        this.grid.fill(0);
        this.colorVar.fill(0);
        this.lifetime.fill(0);
        this.temperature.fill(20);
        this.particleCount = 0;
    }

    /** Check if a cell is empty */
    isEmpty(x, y) {
        return this.inBounds(x, y) && this.grid[this.idx(x, y)] === MaterialType.EMPTY;
    }

    /** Swap two cells */
    swap(x1, y1, x2, y2) {
        const i1 = this.idx(x1, y1);
        const i2 = this.idx(x2, y2);

        let tmp;
        tmp = this.grid[i1]; this.grid[i1] = this.grid[i2]; this.grid[i2] = tmp;
        tmp = this.colorVar[i1]; this.colorVar[i1] = this.colorVar[i2]; this.colorVar[i2] = tmp;
        tmp = this.lifetime[i1]; this.lifetime[i1] = this.lifetime[i2]; this.lifetime[i2] = tmp;
        tmp = this.temperature[i1]; this.temperature[i1] = this.temperature[i2]; this.temperature[i2] = tmp;

        this.updated[i1] = 1;
        this.updated[i2] = 1;
    }

    /** Run one simulation step */
    step() {
        this.frameCount++;
        this.updated.fill(0);
        this.directionBias = !this.directionBias;
        let count = 0;

        // Iterate bottom-to-top so gravity works correctly
        for (let y = this.height - 1; y >= 0; y--) {
            // Alternate left-right to avoid directional bias
            const startX = this.directionBias ? 0 : this.width - 1;
            const endX = this.directionBias ? this.width : -1;
            const stepX = this.directionBias ? 1 : -1;

            for (let x = startX; x !== endX; x += stepX) {
                const i = this.idx(x, y);
                if (this.updated[i]) continue;

                const mat = this.grid[i];
                if (mat === MaterialType.EMPTY) continue;
                count++;

                this.updateParticle(x, y, mat);
            }
        }

        this.particleCount = count;
    }

    /** Update a single particle */
    updateParticle(x, y, mat) {
        const i = this.idx(x, y);

        switch (mat) {
            case MaterialType.SAND:
                this.updatePowder(x, y, 0.97);
                break;
            case MaterialType.WATER:
                this.updateLiquid(x, y, 5);
                break;
            case MaterialType.FIRE:
                this.updateFire(x, y);
                break;
            case MaterialType.SMOKE:
                this.updateGas(x, y);
                break;
            case MaterialType.OIL:
                this.updateLiquid(x, y, 4);
                break;
            case MaterialType.LAVA:
                this.updateLava(x, y);
                break;
            case MaterialType.PLANT:
                this.updatePlant(x, y);
                break;
            case MaterialType.ACID:
                this.updateAcid(x, y);
                break;
            case MaterialType.STEAM:
                this.updateSteam(x, y);
                break;
            case MaterialType.ICE:
                this.updateIce(x, y);
                break;
            case MaterialType.SALT:
                this.updatePowder(x, y, 0.95);
                break;
            case MaterialType.GUNPOWDER:
                this.updateGunpowder(x, y);
                break;
            case MaterialType.WOOD:
                this.updateWood(x, y);
                break;
            // STONE and WALL are static, no update needed
        }
    }

    /** Powder physics (sand, salt) — falls down, slides diagonally */
    updatePowder(x, y, fallChance) {
        if (Math.random() > fallChance && y < this.height -1) return;

        const below = this.get(x, y + 1);

        // Fall straight down
        if (below === MaterialType.EMPTY) {
            this.swap(x, y, x, y + 1);
            return;
        }

        // Sink through liquids
        if (this.isLiquid(below)) {
            if (Math.random() < 0.6) {
                this.swap(x, y, x, y + 1);
                return;
            }
        }

        // Slide diagonally
        const dir = Math.random() < 0.5 ? -1 : 1;
        const dl = this.get(x + dir, y + 1);
        const dr = this.get(x - dir, y + 1);

        if (dl === MaterialType.EMPTY || this.isLiquid(dl)) {
            this.swap(x, y, x + dir, y + 1);
        } else if (dr === MaterialType.EMPTY || this.isLiquid(dr)) {
            this.swap(x, y, x - dir, y + 1);
        }
    }

    /** Liquid physics — falls, spreads horizontally */
    updateLiquid(x, y, spread) {
        const below = this.get(x, y + 1);

        // Fall straight down
        if (below === MaterialType.EMPTY) {
            this.swap(x, y, x, y + 1);
            return;
        }

        // Diagonal falling
        const dir = Math.random() < 0.5 ? -1 : 1;
        const dl = this.get(x + dir, y + 1);
        const dr = this.get(x - dir, y + 1);

        if (dl === MaterialType.EMPTY) {
            this.swap(x, y, x + dir, y + 1);
            return;
        }
        if (dr === MaterialType.EMPTY) {
            this.swap(x, y, x - dir, y + 1);
            return;
        }

        // Spread horizontally
        const spreadDir = Math.random() < 0.5 ? -1 : 1;
        for (let s = 1; s <= spread; s++) {
            const nx = x + spreadDir * s;
            if (this.isEmpty(nx, y)) {
                this.swap(x, y, nx, y);
                return;
            }
            if (this.get(nx, y) !== this.get(x, y) && this.get(nx, y) !== MaterialType.EMPTY) break;
        }
        // Try other direction
        for (let s = 1; s <= spread; s++) {
            const nx = x - spreadDir * s;
            if (this.isEmpty(nx, y)) {
                this.swap(x, y, nx, y);
                return;
            }
            if (this.get(nx, y) !== this.get(x, y) && this.get(nx, y) !== MaterialType.EMPTY) break;
        }
    }

    /** Fire physics — rises, flickers, burns neighbors, has lifetime */
    updateFire(x, y) {
        const i = this.idx(x, y);
        this.lifetime[i]--;

        if (this.lifetime[i] <= 0) {
            // Fire dies out — become smoke or empty
            if (Math.random() < 0.4) {
                this.grid[i] = MaterialType.SMOKE;
                this.lifetime[i] = 30 + Math.random() * 60;
                this.colorVar[i] = Math.floor(Math.random() * 255);
            } else {
                this.grid[i] = MaterialType.EMPTY;
            }
            return;
        }

        // Spread fire to neighbors
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);

                if (neighbor === MaterialType.PLANT || neighbor === MaterialType.WOOD) {
                    if (Math.random() < 0.03) {
                        this.set(nx, ny, MaterialType.FIRE);
                    }
                } else if (neighbor === MaterialType.OIL) {
                    if (Math.random() < 0.25) {
                        this.set(nx, ny, MaterialType.FIRE);
                        this.lifetime[this.idx(nx, ny)] = 90 + Math.random() * 60;
                    }
                } else if (neighbor === MaterialType.GUNPOWDER) {
                    // Gunpowder explodes on contact with fire
                    this.explode(nx, ny, 5);
                    return;
                } else if (neighbor === MaterialType.ICE) {
                    if (Math.random() < 0.05) {
                        this.set(nx, ny, MaterialType.WATER);
                    }
                }
            }
        }

        // Rise upward with flickering
        const above = this.get(x, y - 1);
        if (above === MaterialType.EMPTY) {
            if (Math.random() < 0.7) {
                this.swap(x, y, x, y - 1);
                return;
            }
        }

        // Drift sideways
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.isEmpty(x + dir, y - 1)) {
            this.swap(x, y, x + dir, y - 1);
        } else if (this.isEmpty(x - dir, y - 1)) {
            this.swap(x, y, x - dir, y - 1);
        }
    }

    /** Gas physics — rises, drifts, dissipates */
    updateGas(x, y) {
        const i = this.idx(x, y);
        this.lifetime[i]--;

        if (this.lifetime[i] <= 0) {
            this.grid[i] = MaterialType.EMPTY;
            return;
        }

        // Rise
        if (this.isEmpty(x, y - 1)) {
            if (Math.random() < 0.8) {
                this.swap(x, y, x, y - 1);
                return;
            }
        }

        // Drift sideways
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.isEmpty(x + dir, y - 1)) {
            this.swap(x, y, x + dir, y - 1);
        } else if (this.isEmpty(x + dir, y)) {
            if (Math.random() < 0.4) {
                this.swap(x, y, x + dir, y);
            }
        } else if (this.isEmpty(x - dir, y)) {
            if (Math.random() < 0.3) {
                this.swap(x, y, x - dir, y);
            }
        }
    }

    /** Steam physics — rises fast, condenses back to water */
    updateSteam(x, y) {
        const i = this.idx(x, y);
        this.lifetime[i]--;

        if (this.lifetime[i] <= 0) {
            // Condense back to water
            if (Math.random() < 0.5) {
                this.grid[i] = MaterialType.WATER;
                this.colorVar[i] = Math.floor(Math.random() * 255);
                this.lifetime[i] = 0;
            } else {
                this.grid[i] = MaterialType.EMPTY;
            }
            return;
        }

        // Rise quickly
        if (this.isEmpty(x, y - 1)) {
            this.swap(x, y, x, y - 1);
            return;
        }

        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.isEmpty(x + dir, y - 1)) {
            this.swap(x, y, x + dir, y - 1);
        } else if (this.isEmpty(x + dir, y)) {
            this.swap(x, y, x + dir, y);
        } else if (this.isEmpty(x - dir, y)) {
            this.swap(x, y, x - dir, y);
        }
    }

    /** Lava physics — acts like slow liquid, melts things, creates fire */
    updateLava(x, y) {
        // Check neighbors for reactions
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);

                if (neighbor === MaterialType.WATER) {
                    // Lava + Water = Stone + Steam
                    this.set(nx, ny, MaterialType.STEAM);
                    if (Math.random() < 0.5) {
                        this.set(x, y, MaterialType.STONE);
                        return;
                    }
                } else if (neighbor === MaterialType.ICE) {
                    this.set(nx, ny, MaterialType.WATER);
                } else if (neighbor === MaterialType.PLANT || neighbor === MaterialType.WOOD) {
                    if (Math.random() < 0.1) {
                        this.set(nx, ny, MaterialType.FIRE);
                    }
                } else if (neighbor === MaterialType.GUNPOWDER) {
                    this.explode(nx, ny, 6);
                    return;
                }
            }
        }

        // Move like a slow liquid
        if (Math.random() < 0.4) return; // Lava is viscous

        const below = this.get(x, y + 1);
        if (below === MaterialType.EMPTY) {
            this.swap(x, y, x, y + 1);
            return;
        }

        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.isEmpty(x + dir, y + 1)) {
            this.swap(x, y, x + dir, y + 1);
            return;
        }
        if (this.isEmpty(x - dir, y + 1)) {
            this.swap(x, y, x - dir, y + 1);
            return;
        }

        // Slow horizontal spread
        if (Math.random() < 0.3) {
            if (this.isEmpty(x + dir, y)) {
                this.swap(x, y, x + dir, y);
            } else if (this.isEmpty(x - dir, y)) {
                this.swap(x, y, x - dir, y);
            }
        }
    }

    /** Plant physics — grows toward water, static otherwise */
    updatePlant(x, y) {
        // Check for water nearby to grow
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);

                if (neighbor === MaterialType.WATER) {
                    if (Math.random() < 0.01) {
                        this.set(nx, ny, MaterialType.PLANT);
                    }
                }
            }
        }
    }

    /** Acid physics — dissolves materials */
    updateAcid(x, y) {
        // Check neighbors for things to dissolve
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);

                if (neighbor !== MaterialType.EMPTY && neighbor !== MaterialType.ACID
                    && neighbor !== MaterialType.WALL) {
                    if (Math.random() < 0.03) {
                        // Dissolve neighbor
                        this.set(nx, ny, MaterialType.SMOKE);
                        this.lifetime[this.idx(nx, ny)] = 20 + Math.random() * 30;
                        // Acid is consumed
                        if (Math.random() < 0.5) {
                            const i = this.idx(x, y);
                            this.grid[i] = MaterialType.EMPTY;
                            return;
                        }
                    }
                }
            }
        }

        // Move like water
        this.updateLiquid(x, y, 3);
    }

    /** Ice physics — melts from heat, freezes nearby water */
    updateIce(x, y) {
        const i = this.idx(x, y);

        // Check for heat sources nearby
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);

                if (neighbor === MaterialType.FIRE || neighbor === MaterialType.LAVA) {
                    if (Math.random() < 0.05) {
                        this.set(x, y, MaterialType.WATER);
                        return;
                    }
                }

                // Freeze nearby water
                if (neighbor === MaterialType.WATER) {
                    if (Math.random() < 0.003) {
                        this.set(nx, ny, MaterialType.ICE);
                    }
                }
            }
        }
    }

    /** Gunpowder — falls like powder, explodes near fire */
    updateGunpowder(x, y) {
        // Check for fire
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);
                if (neighbor === MaterialType.FIRE || neighbor === MaterialType.LAVA) {
                    this.explode(x, y, 6);
                    return;
                }
            }
        }

        this.updatePowder(x, y, 0.96);
    }

    /** Wood — burns when near fire */
    updateWood(x, y) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                const neighbor = this.get(nx, ny);
                if (neighbor === MaterialType.FIRE) {
                    if (Math.random() < 0.008) {
                        this.set(x, y, MaterialType.FIRE);
                        return;
                    }
                } else if (neighbor === MaterialType.LAVA) {
                    if (Math.random() < 0.02) {
                        this.set(x, y, MaterialType.FIRE);
                        return;
                    }
                }
            }
        }
    }

    /** Explosion effect */
    explode(cx, cy, radius) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > radius) continue;

                const nx = cx + dx, ny = cy + dy;
                if (!this.inBounds(nx, ny)) continue;

                const mat = this.get(nx, ny);
                if (mat === MaterialType.WALL) continue;

                if (dist < radius * 0.4) {
                    this.set(nx, ny, MaterialType.FIRE);
                    this.lifetime[this.idx(nx, ny)] = 30 + Math.random() * 60;
                } else if (dist < radius * 0.7) {
                    if (mat === MaterialType.GUNPOWDER) {
                        // Chain reaction
                        this.set(nx, ny, MaterialType.FIRE);
                        this.lifetime[this.idx(nx, ny)] = 20 + Math.random() * 40;
                    } else if (Math.random() < 0.7) {
                        this.set(nx, ny, MaterialType.FIRE);
                        this.lifetime[this.idx(nx, ny)] = 15 + Math.random() * 30;
                    }
                } else {
                    if (Math.random() < 0.4) {
                        if (mat !== MaterialType.STONE) {
                            this.set(nx, ny, MaterialType.SMOKE);
                            this.lifetime[this.idx(nx, ny)] = 20 + Math.random() * 40;
                        }
                    }
                }
            }
        }
    }

    /** Check if material is a liquid */
    isLiquid(mat) {
        return mat === MaterialType.WATER || mat === MaterialType.OIL
            || mat === MaterialType.ACID || mat === MaterialType.LAVA;
    }
}
