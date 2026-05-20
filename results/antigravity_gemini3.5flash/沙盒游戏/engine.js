import { MATERIAL_IDS, MATERIALS } from './materials.js';

export class SandEngine {
    constructor(width = 240, height = 160) {
        this.width = width;
        this.height = height;
        this.size = width * height;

        // Grid data
        this.grid = new Uint8Array(this.size);      // Material ID
        this.state = new Uint8Array(this.size);     // Material state (e.g. fire/steam life)
        this.lastUpdate = new Uint32Array(this.size); // Frame number of last update
        this.colorBuffer = new Uint32Array(this.size); // Cached colors for rendering

        // Simulation parameters
        this.frameId = 1;
        this.gravity = 'down'; // 'down', 'up', 'left', 'right'
        this.wind = 0; // -3 to 3 (pushes gases/sparks left/right)
        
        // Chunk optimization
        this.chunkSize = 16;
        this.chunkWidth = Math.ceil(this.width / this.chunkSize);
        this.chunkHeight = Math.ceil(this.height / this.chunkSize);
        this.numChunks = this.chunkWidth * this.chunkHeight;
        this.activeChunks = new Uint8Array(this.numChunks);
        this.nextActiveChunks = new Uint8Array(this.numChunks);

        // Precompute material color variations to avoid overhead
        this.colorPalette = {};
        this.initColorPalette();

        // Clear grid
        this.clear();
    }

    // Precompute randomized colors for each material
    initColorPalette() {
        for (const id in MATERIALS) {
            const mat = MATERIALS[id];
            this.colorPalette[id] = [];
            const variance = mat.colorVariance || 0;
            // Generate 16 color variants for organic texture look
            for (let i = 0; i < 16; i++) {
                const r = Math.max(0, Math.min(255, mat.color[0] + (Math.random() - 0.5) * variance));
                const g = Math.max(0, Math.min(255, mat.color[1] + (Math.random() - 0.5) * variance));
                const b = Math.max(0, Math.min(255, mat.color[2] + (Math.random() - 0.5) * variance));
                const a = mat.color[3] !== undefined ? mat.color[3] : 255;
                // Pack as ABGR (for little-endian Uint32Array canvas representation)
                const packed = (a << 24) | (b << 16) | (g << 8) | r;
                this.colorPalette[id].push(packed);
            }
        }
    }

    getRandomColor(materialId) {
        const palette = this.colorPalette[materialId];
        return palette[Math.floor(Math.random() * palette.length)];
    }

    clear() {
        this.grid.fill(MATERIAL_IDS.AIR);
        this.state.fill(0);
        this.lastUpdate.fill(0);
        this.colorBuffer.fill(0);
        this.activeChunks.fill(1); // Start with all chunks active
        this.nextActiveChunks.fill(1);
    }

    // Coordinates conversion and bounds check
    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    // Chunk management
    activateChunk(cx, cy) {
        if (cx >= 0 && cx < this.chunkWidth && cy >= 0 && cy < this.chunkHeight) {
            this.nextActiveChunks[cy * this.chunkWidth + cx] = 1;
        }
    }

    activateCell(x, y) {
        const cx = Math.floor(x / this.chunkSize);
        const cy = Math.floor(y / this.chunkSize);
        this.activateChunk(cx, cy);
        // Also activate surrounding chunks to prevent border freezing
        this.activateChunk(cx - 1, cy);
        this.activateChunk(cx + 1, cy);
        this.activateChunk(cx, cy - 1);
        this.activateChunk(cx, cy + 1);
        this.activateChunk(cx - 1, cy - 1);
        this.activateChunk(cx + 1, cy - 1);
        this.activateChunk(cx - 1, cy + 1);
        this.activateChunk(cx + 1, cy + 1);
    }

    // Get value at (x,y)
    getMaterial(x, y) {
        if (!this.inBounds(x, y)) return MATERIAL_IDS.STONE; // Border acts like Stone
        return this.grid[y * this.width + x];
    }

    // Set cell material
    setCell(x, y, materialId, lifeState = 0) {
        if (!this.inBounds(x, y)) return;
        const idx = y * this.width + x;
        const oldId = this.grid[idx];
        if (oldId === materialId && this.state[idx] === lifeState) return;

        this.grid[idx] = materialId;
        this.state[idx] = lifeState;
        this.colorBuffer[idx] = this.getRandomColor(materialId);
        this.lastUpdate[idx] = this.frameId;
        this.activateCell(x, y);
    }

    // Swap two cells
    swap(x1, y1, x2, y2) {
        const idx1 = y1 * this.width + x1;
        const idx2 = y2 * this.width + x2;

        const tempGrid = this.grid[idx1];
        const tempState = this.state[idx1];
        const tempColor = this.colorBuffer[idx1];

        this.grid[idx1] = this.grid[idx2];
        this.state[idx1] = this.state[idx2];
        this.colorBuffer[idx1] = this.colorBuffer[idx2];
        this.lastUpdate[idx1] = this.frameId;

        this.grid[idx2] = tempGrid;
        this.state[idx2] = tempState;
        this.colorBuffer[idx2] = tempColor;
        this.lastUpdate[idx2] = this.frameId;

        this.activateCell(x1, y1);
        this.activateCell(x2, y2);
    }

    // Gravity direction coordinate offsets
    getGravityDirs() {
        switch (this.gravity) {
            case 'up':
                return { dx: 0, dy: -1, perpX: 1, perpY: 0 };
            case 'left':
                return { dx: -1, dy: 0, perpX: 0, perpY: 1 };
            case 'right':
                return { dx: 1, dy: 0, perpX: 0, perpY: 1 };
            case 'down':
            default:
                return { dx: 0, dy: 1, perpX: 1, perpY: 0 };
        }
    }

    // Main step function called once per frame
    step() {
        this.frameId++;
        this.nextActiveChunks.fill(0);

        const g = this.getGravityDirs();
        
        // Scan direction based on gravity to ensure smooth movements
        // If gravity is down (dy = 1), we scan from bottom to top
        // If gravity is up (dy = -1), we scan from top to bottom
        // If gravity is left (dx = -1), we scan from left to right
        // If gravity is right (dx = 1), we scan from right to left
        const startY = g.dy >= 0 ? this.height - 1 : 0;
        const endY = g.dy >= 0 ? -1 : this.height;
        const stepY = g.dy >= 0 ? -1 : 1;

        const startX = g.dx >= 0 ? this.width - 1 : 0;
        const endX = g.dx >= 0 ? -1 : this.width;
        const stepX = g.dx >= 0 ? -1 : 1;

        // Alternate horizontal scan direction to prevent bias
        const leftToRight = Math.random() > 0.5;

        for (let cy = 0; cy < this.chunkHeight; cy++) {
            // Respect scan direction for chunks
            const actualCy = g.dy >= 0 ? this.chunkHeight - 1 - cy : cy;

            for (let cx = 0; cx < this.chunkWidth; cx++) {
                const actualCx = leftToRight ? cx : this.chunkWidth - 1 - cx;
                const chunkIdx = actualCy * this.chunkWidth + actualCx;

                if (this.activeChunks[chunkIdx] === 0) {
                    continue; // Skip inactive chunks
                }

                // Scan cells inside chunk
                const yMin = actualCy * this.chunkSize;
                const yMax = Math.min(this.height, yMin + this.chunkSize);
                const xMin = actualCx * this.chunkSize;
                const xMax = Math.min(this.width, xMin + this.chunkSize);

                for (let y = (g.dy >= 0 ? yMax - 1 : yMin); (g.dy >= 0 ? y >= yMin : y < yMax); y += stepY) {
                    for (let x = (leftToRight ? xMin : xMax - 1); (leftToRight ? x < xMax : x >= xMin); x += (leftToRight ? 1 : -1)) {
                        this.updateCell(x, y, g);
                    }
                }
            }
        }

        // Swap active chunk buffers
        this.activeChunks.set(this.nextActiveChunks);
    }

    updateCell(x, y, g) {
        const idx = y * this.width + x;
        const id = this.grid[idx];
        if (id === MATERIAL_IDS.AIR) return;

        // Skip if updated this frame
        if (this.lastUpdate[idx] === this.frameId) return;

        const mat = MATERIALS[id];
        
        // 1. Fire / Heat interactions
        if (mat.state === 'fire' || id === MATERIAL_IDS.LAVA || id === MATERIAL_IDS.SPARK) {
            this.handleIgnition(x, y);
        }

        // 2. Specialized Chemical / Physical Reactions
        if (id === MATERIAL_IDS.LAVA) {
            if (this.handleLavaReactions(x, y)) return;
        }
        if (id === MATERIAL_IDS.ACID) {
            if (this.handleAcidCorrosion(x, y)) return;
        }
        if (id === MATERIAL_IDS.WATER) {
            if (this.handleWaterReactions(x, y)) return;
        }
        if (id === MATERIAL_IDS.PLANT) {
            this.handlePlantGrowth(x, y);
            return; // Plants are static solids
        }
        if (id === MATERIAL_IDS.ICE) {
            if (this.handleIceMelting(x, y)) return;
        }

        // 3. Movement Physics based on state
        if (mat.state === 'solid') {
            return; // Solids don't move
        }

        // Keep active chunk awake if it contains particles that might react/move
        this.activateCell(x, y);

        if (id === MATERIAL_IDS.FIRE) {
            this.handleFireMovement(x, y, g);
            return;
        }

        if (id === MATERIAL_IDS.SPARK) {
            this.handleSparkMovement(x, y);
            return;
        }

        if (mat.state === 'gas') {
            this.handleGasMovement(x, y, g);
            return;
        }

        if (mat.state === 'powder') {
            this.handlePowderMovement(x, y, g);
            return;
        }

        if (id === MATERIAL_IDS.CONCRETE) { // heavy_powder
            this.handleConcreteMovement(x, y, g);
            return;
        }

        if (mat.state === 'liquid') {
            this.handleLiquidMovement(x, y, g);
            return;
        }
    }

    // Movement: Powders (Sand, Gunpowder)
    handlePowderMovement(x, y, g) {
        const id = this.getMaterial(x, y);
        const density = MATERIALS[id].density;

        // Try direct down
        const dx = x + g.dx;
        const dy = y + g.dy;
        if (this.canSwapWith(id, dx, dy)) {
            this.swap(x, y, dx, dy);
            return;
        }

        // Try down-left or down-right diagonally
        const leftFirst = Math.random() > 0.5;
        const sides = leftFirst ? 
            [[x + g.dx - g.perpX, y + g.dy - g.perpY], [x + g.dx + g.perpX, y + g.dy + g.perpY]] : 
            [[x + g.dx + g.perpX, y + g.dy + g.perpY], [x + g.dx - g.perpX, y + g.dy - g.perpY]];

        for (const [tx, ty] of sides) {
            if (this.canSwapWith(id, tx, ty)) {
                this.swap(x, y, tx, ty);
                return;
            }
        }
    }

    // Concrete falls straight down, never spreads diagonally
    handleConcreteMovement(x, y, g) {
        const id = this.getMaterial(x, y);
        const dx = x + g.dx;
        const dy = y + g.dy;
        if (this.canSwapWith(id, dx, dy)) {
            this.swap(x, y, dx, dy);
        }
    }

    // Movement: Liquids (Water, Oil, Acid, Lava)
    handleLiquidMovement(x, y, g) {
        const id = this.getMaterial(x, y);

        // Try direct down
        const dx = x + g.dx;
        const dy = y + g.dy;
        if (this.canSwapWith(id, dx, dy)) {
            this.swap(x, y, dx, dy);
            return;
        }

        // Try diagonal down
        const leftFirst = Math.random() > 0.5;
        const diagSides = leftFirst ? 
            [[x + g.dx - g.perpX, y + g.dy - g.perpY], [x + g.dx + g.perpX, y + g.dy + g.perpY]] : 
            [[x + g.dx + g.perpX, y + g.dy + g.perpY], [x + g.dx - g.perpX, y + g.dy - g.perpY]];

        for (const [tx, ty] of diagSides) {
            if (this.canSwapWith(id, tx, ty)) {
                this.swap(x, y, tx, ty);
                return;
            }
        }

        // Try flow sideways
        const horizSides = leftFirst ?
            [[x - g.perpX, y - g.perpY], [x + g.perpX, y + g.perpY]] :
            [[x + g.perpX, y + g.perpY], [x - g.perpX, y - g.perpY]];

        for (const [tx, ty] of horizSides) {
            if (this.canSwapWith(id, tx, ty)) {
                this.swap(x, y, tx, ty);
                return;
            }
        }
    }

    // Movement: Gases (Gas, Steam, Smoke, Acid Gas)
    handleGasMovement(x, y, g) {
        const idx = y * this.width + x;
        const id = this.grid[idx];
        
        // Age gas
        this.state[idx]++;
        const maxLife = id === MATERIAL_IDS.STEAM ? 100 + Math.random() * 80 :
                        id === MATERIAL_IDS.SMOKE ? 50 + Math.random() * 50 : 250; // Gas is highly stable

        if (this.state[idx] >= maxLife) {
            if (id === MATERIAL_IDS.STEAM && Math.random() < 0.15) {
                // Condense to water
                this.setCell(x, y, MATERIAL_IDS.WATER);
            } else {
                this.setCell(x, y, MATERIAL_IDS.AIR);
            }
            return;
        }

        // Wind drift offset
        let windX = 0;
        if (this.wind !== 0 && Math.random() < Math.abs(this.wind) * 0.15) {
            windX = this.wind > 0 ? 1 : -1;
        }

        // Gases rise: opposite gravity direction (-g.dx, -g.dy)
        const dx = x - g.dx + windX;
        const dy = y - g.dy;

        // Try direct up
        if (this.canSwapWith(id, dx, dy)) {
            this.swap(x, y, dx, dy);
            return;
        }

        // Try diagonal up
        const leftFirst = Math.random() > 0.5;
        const diagSides = leftFirst ? 
            [[x - g.dx - g.perpX, y - g.dy - g.perpY], [x - g.dx + g.perpX, y - g.dy + g.perpY]] : 
            [[x - g.dx + g.perpX, y - g.dy + g.perpY], [x - g.dx - g.perpX, y - g.dy - g.perpY]];

        for (const [tx, ty] of diagSides) {
            if (this.canSwapWith(id, tx, ty)) {
                this.swap(x, y, tx, ty);
                return;
            }
        }

        // Try flow sideways
        const horizSides = leftFirst ?
            [[x - g.perpX, y - g.perpY], [x + g.perpX, y + g.perpY]] :
            [[x + g.perpX, y + g.perpY], [x - g.perpX, y - g.perpY]];

        for (const [tx, ty] of horizSides) {
            if (this.canSwapWith(id, tx, ty)) {
                this.swap(x, y, tx, ty);
                return;
            }
        }
    }

    // Movement: Fire
    handleFireMovement(x, y, g) {
        const idx = y * this.width + x;
        
        // Age fire
        this.state[idx]++;
        const fireLife = 12 + Math.random() * 25;
        if (this.state[idx] >= fireLife) {
            // Turn into smoke or air
            if (Math.random() < 0.35) {
                this.setCell(x, y, MATERIAL_IDS.SMOKE, 0);
            } else {
                this.setCell(x, y, MATERIAL_IDS.AIR, 0);
            }
            return;
        }

        // Fire rises (opposite gravity)
        const dx = x - g.dx + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 1 : 0);
        const dy = y - g.dy;

        if (this.inBounds(dx, dy)) {
            const target = this.getMaterial(dx, dy);
            if (target === MATERIAL_IDS.AIR || target === MATERIAL_IDS.STEAM || target === MATERIAL_IDS.SMOKE) {
                this.swap(x, y, dx, dy);
            }
        }
    }

    // Movement: Spark (fast flying fire particle)
    handleSparkMovement(x, y) {
        const idx = y * this.width + x;
        this.state[idx]++;

        if (this.state[idx] > 8 + Math.random() * 8) {
            this.setCell(x, y, MATERIAL_IDS.AIR);
            return;
        }

        // Fly in random directions
        const dx = x + Math.floor((Math.random() - 0.5) * 5);
        const dy = y + Math.floor((Math.random() - 0.5) * 5);

        if (this.inBounds(dx, dy)) {
            const target = this.getMaterial(dx, dy);
            if (target === MATERIAL_IDS.AIR) {
                this.swap(x, y, dx, dy);
            } else if (MATERIALS[target].flammability > 0) {
                // Ignite on contact!
                this.igniteCell(dx, dy);
            }
        }
    }

    // Verify if material A can displace/swap with material at (tx, ty)
    canSwapWith(selfId, tx, ty) {
        if (!this.inBounds(tx, ty)) return false;
        
        const otherId = this.grid[ty * this.width + tx];
        if (otherId === MATERIAL_IDS.AIR) return true;

        const self = MATERIALS[selfId];
        const other = MATERIALS[otherId];

        // Powders & Liquids can sink in liquids/gases of lower density
        if (self.state === 'powder' && (other.state === 'liquid' || other.state === 'gas')) {
            return self.density > other.density;
        }

        if (self.state === 'liquid' && (other.state === 'liquid' || other.state === 'gas')) {
            return self.density > other.density;
        }

        if (self.state === 'gas' && other.state === 'gas') {
            // Gases float upwards, meaning less dense gas displaces more dense gas upwards
            // In our system density is negative for gas, so e.g. Steam (-2) is lighter than Gas (-1).
            // So Steam wants to swap upwards with Gas.
            return self.density < other.density; 
        }

        return false;
    }

    // 1. Ignition and Burning
    handleIgnition(x, y) {
        const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for (const [nx, ny] of neighbors) {
            const tx = x + nx;
            const ty = y + ny;
            if (this.inBounds(tx, ty)) {
                const targetId = this.grid[ty * this.width + tx];
                const target = MATERIALS[targetId];
                if (target && target.flammability > 0) {
                    if (Math.random() < target.flammability) {
                        this.igniteCell(tx, ty);
                    }
                }
            }
        }
    }

    igniteCell(x, y) {
        const id = this.getMaterial(x, y);
        if (id === MATERIAL_IDS.GUNPOWDER) {
            this.explode(x, y, 6); // Small explosion
        } else if (id === MATERIAL_IDS.TNT) {
            this.explode(x, y, 22); // Massive explosion
        } else if (id === MATERIAL_IDS.GAS) {
            this.setCell(x, y, MATERIAL_IDS.FIRE, 0);
            // Chain combustion of gas in nearby area
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (this.getMaterial(x+i, y+j) === MATERIAL_IDS.GAS) {
                        this.setCell(x+i, y+j, MATERIAL_IDS.FIRE, 0);
                    }
                }
            }
        } else if (id === MATERIAL_IDS.WOOD || id === MATERIAL_IDS.PLANT) {
            this.setCell(x, y, MATERIAL_IDS.FIRE, 0);
        } else if (id === MATERIAL_IDS.OIL) {
            this.setCell(x, y, MATERIAL_IDS.FIRE, 0);
        }
    }

    // Explosion physics
    explode(cx, cy, radius) {
        const r2 = radius * radius;
        // First pass: replace cells with Fire / Smoke / Spark
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = cx + dx;
                const y = cy + dy;
                if (!this.inBounds(x, y)) continue;

                const dist2 = dx*dx + dy*dy;
                if (dist2 <= r2) {
                    const targetId = this.grid[y * this.width + x];
                    if (targetId === MATERIAL_IDS.STONE) {
                        // Stone is highly resistant, gets damaged only near center
                        if (dist2 < r2 * 0.25 && Math.random() < 0.6) {
                            this.setCell(x, y, MATERIAL_IDS.AIR);
                        }
                    } else if (targetId === MATERIAL_IDS.TNT || targetId === MATERIAL_IDS.GUNPOWDER) {
                        // Chain reaction! Ignite explosives
                        if (Math.random() < 0.8) {
                            this.igniteCell(x, y);
                        }
                    } else if (targetId !== MATERIAL_IDS.GLASS) {
                        // Destroy solid blockages or powders
                        const rand = Math.random();
                        if (rand < 0.4) {
                            this.setCell(x, y, MATERIAL_IDS.FIRE, Math.floor(Math.random() * 10));
                        } else if (rand < 0.6) {
                            this.setCell(x, y, MATERIAL_IDS.SPARK, 0);
                        } else if (rand < 0.85) {
                            this.setCell(x, y, MATERIAL_IDS.SMOKE, Math.floor(Math.random() * 20));
                        } else {
                            this.setCell(x, y, MATERIAL_IDS.AIR);
                        }
                    }
                } else if (dist2 <= r2 * 1.5) {
                    // Outward shockwave pushes/ignites
                    const targetId = this.grid[y * this.width + x];
                    if (MATERIALS[targetId].flammability > 0 && Math.random() < 0.5) {
                        this.igniteCell(x, y);
                    }
                }
            }
        }
    }

    // 2. Lava chemistry
    handleLavaReactions(x, y) {
        const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [nx, ny] of neighbors) {
            const tx = x + nx;
            const ty = y + ny;
            if (!this.inBounds(tx, ty)) continue;

            const target = this.grid[ty * this.width + tx];

            // Lava + Water = Stone + Steam
            if (target === MATERIAL_IDS.WATER) {
                this.setCell(x, y, MATERIAL_IDS.STONE);
                this.setCell(tx, ty, MATERIAL_IDS.STEAM, 0);
                return true;
            }

            // Lava + Sand = Glass
            if (target === MATERIAL_IDS.SAND) {
                this.setCell(tx, ty, MATERIAL_IDS.GLASS);
                this.activateCell(tx, ty);
            }

            // Lava + Ice = Lava + Water
            if (target === MATERIAL_IDS.ICE) {
                this.setCell(tx, ty, MATERIAL_IDS.WATER);
                this.activateCell(tx, ty);
            }

            // Lava + Acid = Stone + Steam/Acid Gas
            if (target === MATERIAL_IDS.ACID) {
                this.setCell(x, y, MATERIAL_IDS.STONE);
                this.setCell(tx, ty, MATERIAL_IDS.ACID_GAS, 0);
                return true;
            }
        }
        return false;
    }

    // 3. Acid dissolution
    handleAcidCorrosion(x, y) {
        const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        const idx = y * this.width + x;

        for (const [nx, ny] of neighbors) {
            const tx = x + nx;
            const ty = y + ny;
            if (!this.inBounds(tx, ty)) continue;

            const targetId = this.grid[ty * this.width + tx];
            if (targetId === MATERIAL_IDS.AIR || targetId === MATERIAL_IDS.ACID || targetId === MATERIAL_IDS.GLASS) {
                continue;
            }

            const target = MATERIALS[targetId];
            if (target.acidResistance < 1.0) {
                // Try to dissolve
                if (Math.random() > target.acidResistance) {
                    // Turn target into Acid Gas or empty space
                    if (Math.random() < 0.4) {
                        this.setCell(tx, ty, MATERIAL_IDS.ACID_GAS, 0);
                    } else {
                        this.setCell(tx, ty, MATERIAL_IDS.AIR);
                    }
                    
                    // Consume the acid itself with some probability
                    if (Math.random() < 0.6) {
                        this.setCell(x, y, MATERIAL_IDS.AIR);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 4. Water interactions (cooling/extinguishing)
    handleWaterReactions(x, y) {
        const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for (const [nx, ny] of neighbors) {
            const tx = x + nx;
            const ty = y + ny;
            if (!this.inBounds(tx, ty)) continue;

            const target = this.grid[ty * this.width + tx];

            // Water extinguishes Fire
            if (target === MATERIAL_IDS.FIRE || target === MATERIAL_IDS.SPARK) {
                this.setCell(tx, ty, MATERIAL_IDS.STEAM, 0);
                if (Math.random() < 0.2) {
                    this.setCell(x, y, MATERIAL_IDS.AIR); // Water evaporates
                    return true;
                }
            }
        }
        return false;
    }

    // 5. Plant growth (Plants spread when touching water, burn quickly)
    handlePlantGrowth(x, y) {
        const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [nx, ny] of neighbors) {
            const tx = x + nx;
            const ty = y + ny;
            if (!this.inBounds(tx, ty)) continue;

            const target = this.grid[ty * this.width + tx];

            // Plants drink water to spread
            if (target === MATERIAL_IDS.WATER) {
                if (Math.random() < 0.05) {
                    this.setCell(tx, ty, MATERIAL_IDS.PLANT);
                }
            }

            // Plants grow slowly into empty spaces if there is water nearby
            if (target === MATERIAL_IDS.AIR) {
                // Look for nearby water
                if (Math.random() < 0.002) {
                    // Check if adjacent to dirt/wood or other plant
                    this.setCell(tx, ty, MATERIAL_IDS.PLANT);
                }
            }
        }
    }

    // 6. Ice melting when hot
    handleIceMelting(x, y) {
        const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for (const [nx, ny] of neighbors) {
            const tx = x + nx;
            const ty = y + ny;
            if (!this.inBounds(tx, ty)) continue;

            const target = this.grid[ty * this.width + tx];
            // If ice touches Fire, Lava or Steam, it melts into water
            if (target === MATERIAL_IDS.FIRE || target === MATERIAL_IDS.LAVA || target === MATERIAL_IDS.STEAM) {
                this.setCell(x, y, MATERIAL_IDS.WATER);
                return true;
            }
        }
        return false;
    }

    // API: Draw a circle brush of material
    paint(cx, cy, radius, materialId) {
        const r2 = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = cx + dx;
                const y = cy + dy;
                if (!this.inBounds(x, y)) continue;

                if (dx*dx + dy*dy <= r2) {
                    if (materialId === MATERIAL_IDS.AIR) {
                        this.setCell(x, y, MATERIAL_IDS.AIR);
                    } else {
                        // Do not overwrite stone/glass unless brush is eraser/stone
                        const current = this.grid[y * this.width + x];
                        if (current !== MATERIAL_IDS.STONE && current !== MATERIAL_IDS.GLASS || materialId === MATERIAL_IDS.STONE || materialId === MATERIAL_IDS.AIR) {
                            this.setCell(x, y, materialId);
                        }
                    }
                }
            }
        }
    }

    // Rendering method: draws to canvas using direct Uint32Array copy (extremely fast)
    render(imageData) {
        // imageData.data is a Uint8ClampedArray.
        // We can wrap it with a Uint32Array to write pixels in one go.
        const pixelData = new Uint32Array(imageData.data.buffer);
        pixelData.set(this.colorBuffer);
    }
}
