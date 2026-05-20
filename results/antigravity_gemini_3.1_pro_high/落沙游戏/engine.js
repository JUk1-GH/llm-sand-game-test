// Material Definitions
const MATERIALS = {
    EMPTY: { id: 0, name: 'Empty', color: [0, 0, 0], type: 'empty' },
    SAND:  { id: 1, name: 'Sand', color: [244, 164, 96], type: 'powder' },
    WATER: { id: 2, name: 'Water', color: [64, 164, 223], type: 'liquid' },
    WOOD:  { id: 3, name: 'Wood', color: [133, 94, 66], type: 'solid' },
    FIRE:  { id: 4, name: 'Fire', color: [226, 88, 34], type: 'gas' },
    SMOKE: { id: 5, name: 'Smoke', color: [169, 169, 169], type: 'gas' },
    STONE: { id: 6, name: 'Stone', color: [128, 128, 128], type: 'solid' }
};

class Engine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = new Uint8Array(width * height);
        this.colors = new Uint32Array(width * height); // Stores ABGR format for fast canvas copy
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    setMaterial(x, y, matId) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const index = this.getIndex(x, y);
        this.grid[index] = matId;
        
        // Add some random variation to color
        if (matId === 0) {
            this.colors[index] = 0; // Black/transparent
        } else {
            const matColor = Object.values(MATERIALS).find(m => m.id === matId).color;
            // variation
            let variation = (Math.random() - 0.5) * 20;
            if (matId === MATERIALS.FIRE.id) variation = (Math.random()) * 50; 
            
            let r = Math.min(255, Math.max(0, matColor[0] + variation)) | 0;
            let g = Math.min(255, Math.max(0, matColor[1] + variation)) | 0;
            let b = Math.min(255, Math.max(0, matColor[2] + variation)) | 0;
            
            // Format ABGR
            this.colors[index] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }

    getMaterial(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return MATERIALS.STONE.id; // Bounds act as stone
        return this.grid[this.getIndex(x, y)];
    }

    swap(x1, y1, x2, y2) {
        const idx1 = this.getIndex(x1, y1);
        const idx2 = this.getIndex(x2, y2);
        
        const tempMat = this.grid[idx1];
        this.grid[idx1] = this.grid[idx2];
        this.grid[idx2] = tempMat;

        const tempCol = this.colors[idx1];
        this.colors[idx1] = this.colors[idx2];
        this.colors[idx2] = tempCol;
    }

    clear() {
        this.grid.fill(0);
        this.colors.fill(0);
        // Reset bounds
        for(let i=0; i<this.width; i++) {
            this.setMaterial(i, this.height-1, MATERIALS.STONE.id);
            this.setMaterial(i, this.height-2, MATERIALS.STONE.id);
        }
        for(let j=this.height-30; j<this.height; j++){
           this.setMaterial(0, j, MATERIALS.STONE.id);
           this.setMaterial(this.width-1, j, MATERIALS.STONE.id);
        }
    }

    update() {
        // Randomize direction to prevent biased flowing
        const dir = Math.random() > 0.5 ? 1 : -1;
        
        // Bottom-up update to correctly process falling
        for (let y = this.height - 1; y >= 0; y--) {
            for (let i = 0; i < this.width; i++) {
                let x = dir === 1 ? i : this.width - 1 - i;
                
                let matId = this.grid[this.getIndex(x, y)];
                if (matId === 0 || matId === MATERIALS.STONE.id || matId === MATERIALS.WOOD.id) continue;

                if (matId === MATERIALS.SAND.id) this.updateSand(x, y);
                else if (matId === MATERIALS.WATER.id) this.updateWater(x, y);
                else if (matId === MATERIALS.FIRE.id) this.updateFire(x, y);
                else if (matId === MATERIALS.SMOKE.id) this.updateSmoke(x, y);
            }
        }
    }

    isEmptyOrWater(x, y) {
        const m = this.getMaterial(x, y);
        return m === MATERIALS.EMPTY.id || m === MATERIALS.WATER.id;
    }

    updateSand(x, y) {
        if (this.isEmptyOrWater(x, y + 1)) {
            this.swap(x, y, x, y + 1);
        } else {
            const left = this.isEmptyOrWater(x - 1, y + 1);
            const right = this.isEmptyOrWater(x + 1, y + 1);
            if (left && right) {
                this.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y + 1);
            } else if (left) {
                this.swap(x, y, x - 1, y + 1);
            } else if (right) {
                this.swap(x, y, x + 1, y + 1);
            }
        }
    }

    updateWater(x, y) {
        if (this.getMaterial(x, y + 1) === MATERIALS.EMPTY.id) {
            this.swap(x, y, x, y + 1);
        } else {
            const left = this.getMaterial(x - 1, y + 1) === MATERIALS.EMPTY.id;
            const right = this.getMaterial(x + 1, y + 1) === MATERIALS.EMPTY.id;
            if (left && right) {
                this.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y + 1);
            } else if (left) {
                this.swap(x, y, x - 1, y + 1);
            } else if (right) {
                this.swap(x, y, x + 1, y + 1);
            } else {
                // Flow horizontally
                const canLeft = this.getMaterial(x - 1, y) === MATERIALS.EMPTY.id;
                const canRight = this.getMaterial(x + 1, y) === MATERIALS.EMPTY.id;
                
                const flowRate = 4;
                let finalX = x;
                
                if (canLeft && canRight) {
                    let d = Math.random() > 0.5 ? 1 : -1;
                    for(let i=1; i<=flowRate; i++) {
                        if(this.getMaterial(x + i*d, y) === MATERIALS.EMPTY.id) finalX = x + i*d;
                        else break;
                    }
                } else if (canLeft) {
                    for(let i=1; i<=flowRate; i++) {
                        if(this.getMaterial(x - i, y) === MATERIALS.EMPTY.id) finalX = x - i;
                        else break;
                    }
                } else if (canRight) {
                    for(let i=1; i<=flowRate; i++) {
                        if(this.getMaterial(x + i, y) === MATERIALS.EMPTY.id) finalX = x + i;
                        else break;
                    }
                }
                if(finalX !== x) this.swap(x, y, finalX, y);
            }
        }
    }

    updateSmoke(x, y) {
        // Randomly die out
        if (Math.random() < 0.05) {
            this.setMaterial(x, y, MATERIALS.EMPTY.id);
            return;
        }

        const up = this.getMaterial(x, y - 1);
        if (up === MATERIALS.EMPTY.id || up === MATERIALS.WATER.id) {
            this.swap(x, y, x, y - 1);
        } else {
            const left = this.getMaterial(x - 1, y - 1) === MATERIALS.EMPTY.id;
            const right = this.getMaterial(x + 1, y - 1) === MATERIALS.EMPTY.id;
            if (left && right) {
                this.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y - 1);
            } else if (left) {
                this.swap(x, y, x - 1, y - 1);
            } else if (right) {
                this.swap(x, y, x + 1, y - 1);
            } else {
                // drift horizontal
                if (Math.random() < 0.3) {
                    const l = this.getMaterial(x-1, y) === MATERIALS.EMPTY.id;
                    const r = this.getMaterial(x+1, y) === MATERIALS.EMPTY.id;
                    if(l && r) this.swap(x, y, Math.random() > 0.5 ? x-1 : x+1, y);
                    else if(l) this.swap(x, y, x-1, y);
                    else if(r) this.swap(x, y, x+1, y);
                }
            }
        }
    }

    updateFire(x, y) {
        // Fire dies out quickly
        if (Math.random() < 0.1) {
            this.setMaterial(x, y, Math.random() < 0.3 ? MATERIALS.SMOKE.id : MATERIALS.EMPTY.id);
            return;
        }
        
        // Flicker color
        const idx = this.getIndex(x, y);
        let r = 200 + Math.random() * 55 | 0;
        let g = 50 + Math.random() * 80 | 0;
        let b = 0;
        this.colors[idx] = (255 << 24) | (b << 16) | (g << 8) | r;

        const neighbors = [[x, y-1], [x, y+1], [x-1, y], [x+1, y], [x-1, y-1], [x+1, y-1]];
        
        // Rise slightly like smoke
        if (Math.random() < 0.3 && this.getMaterial(x, y-1) === MATERIALS.EMPTY.id) {
            this.swap(x, y, x, y-1);
            y = y - 1; // update y just in case
        }

        for (let [nx, ny] of neighbors) {
            const mat = this.getMaterial(nx, ny);
            if (mat === MATERIALS.WOOD.id && Math.random() < 0.05) {
                this.setMaterial(nx, ny, MATERIALS.FIRE.id);
            }
            // Water extinguishes fire
            else if (mat === MATERIALS.WATER.id && Math.random() < 0.5) {
                this.setMaterial(x, y, MATERIALS.SMOKE.id);
                this.setMaterial(nx, ny, MATERIALS.SMOKE.id);
            }
        }
    }
}
