// physics.js - 物理引擎（粉末/液体/气体移动 + 交互反应 + 爆炸）

// 主调度
function updatePhysics(sim, x, y, mat) {
    const props = MaterialProps[mat];
    if (!props) return;

    // 先处理交互反应
    if (handleReactions(sim, x, y, mat)) return;

    // 按类型执行移动
    switch (props.type) {
        case 'powder': updatePowder(sim, x, y, mat); break;
        case 'liquid': updateLiquid(sim, x, y, mat); break;
        case 'gas':    updateGas(sim, x, y, mat); break;
        // solid 不移动
    }
}

// ============ 粉末移动 ============
function updatePowder(sim, x, y, mat) {
    const props = MaterialProps[mat];

    // 1. 尝试正下方
    if (tryMovePowder(sim, x, y, x, y + 1, mat, props)) return;

    // 2. 对角下（随机顺序）
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryMovePowder(sim, x, y, x + dir, y + 1, mat, props)) return;
    if (tryMovePowder(sim, x, y, x - dir, y + 1, mat, props)) return;
}

function tryMovePowder(sim, x1, y1, x2, y2, mat, props) {
    if (!sim.inBounds(x2, y2)) return false;
    const target = sim.get(x2, y2);
    if (target === Materials.EMPTY) {
        sim.swap(x1, y1, x2, y2);
        return true;
    }
    // 密度置换：粉末沉入密度更低的液体
    const targetProps = MaterialProps[target];
    if (targetProps && targetProps.type === 'liquid' && props.density > targetProps.density) {
        sim.swap(x1, y1, x2, y2);
        return true;
    }
    return false;
}

// ============ 液体移动 ============
function updateLiquid(sim, x, y, mat) {
    const props = MaterialProps[mat];

    // 1. 正下方
    if (tryMoveLiquid(sim, x, y, x, y + 1, mat, props)) return;

    // 2. 对角下
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryMoveLiquid(sim, x, y, x + dir, y + 1, mat, props)) return;
    if (tryMoveLiquid(sim, x, y, x - dir, y + 1, mat, props)) return;

    // 3. 水平扩散
    const spread = props.spreadRate || 3;
    if (Math.random() < 0.5) {
        for (let d = dir; d !== -dir * (spread + 1); d += dir) {
            if (tryMoveLiquid(sim, x, y, x + d, y, mat, props)) return;
            if (!sim.isEmpty(x + d, y) && sim.get(x + d, y) !== mat) break;
        }
    } else {
        for (let d = -dir; d !== dir * (spread + 1); d -= dir) {
            if (tryMoveLiquid(sim, x, y, x + d, y, mat, props)) return;
            if (!sim.isEmpty(x + d, y) && sim.get(x + d, y) !== mat) break;
        }
    }
}

function tryMoveLiquid(sim, x1, y1, x2, y2, mat, props) {
    if (!sim.inBounds(x2, y2)) return false;
    const target = sim.get(x2, y2);
    if (target === Materials.EMPTY) {
        sim.swap(x1, y1, x2, y2);
        return true;
    }
    // 密度分层：重液体下沉，轻液体上浮
    const targetProps = MaterialProps[target];
    if (targetProps && targetProps.type === 'liquid' && props.density > targetProps.density) {
        sim.swap(x1, y1, x2, y2);
        return true;
    }
    return false;
}

// ============ 气体移动 ============
function updateGas(sim, x, y, mat) {
    const i = sim.idx(x, y);
    sim.life[i]--;

    // 生命值耗尽消失
    if (sim.life[i] <= 0) {
        sim.clear(x, y);
        return;
    }

    // 1. 正上方
    if (tryMoveGas(sim, x, y, x, y - 1)) return;

    // 2. 对角上
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryMoveGas(sim, x, y, x + dir, y - 1)) return;
    if (tryMoveGas(sim, x, y, x - dir, y - 1)) return;

    // 3. 水平漂移
    if (Math.random() < 0.3) {
        const drift = Math.random() < 0.5 ? -1 : 1;
        tryMoveGas(sim, x, y, x + drift, y);
    }
}

function tryMoveGas(sim, x1, y1, x2, y2) {
    if (!sim.inBounds(x2, y2)) return false;
    if (sim.isEmpty(x2, y2)) {
        sim.swap(x1, y1, x2, y2);
        return true;
    }
    return false;
}

// ============ 交互反应 ============
function handleReactions(sim, x, y, mat) {
    switch (mat) {
        case Materials.FIRE:    return handleFire(sim, x, y);
        case Materials.WATER:   return handleWater(sim, x, y);
        case Materials.LAVA:    return handleLava(sim, x, y);
        case Materials.ACID:    return handleAcid(sim, x, y);
        case Materials.ICE:     return handleIce(sim, x, y);
        case Materials.PLANT:   return handlePlant(sim, x, y);
    }
    return false;
}

// 4方向邻居迭代
const NEIGHBOR_OFFSETS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function getNeighbors(sim, x, y) {
    const neighbors = [];
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
        const nx = x + dx;
        const ny = y + dy;
        if (sim.inBounds(nx, ny)) {
            neighbors.push([nx, ny, sim.get(nx, ny)]);
        }
    }
    return neighbors;
}

// Fire: 点燃可燃物，融化Ice，生命值递减
function handleFire(sim, x, y) {
    const i = sim.idx(x, y);
    sim.life[i]--;

    if (sim.life[i] <= 0) {
        // 火熄灭产生烟
        if (Math.random() < 0.5) {
            sim.set(x, y, Materials.SMOKE, MaterialProps[Materials.SMOKE].maxLife);
        } else {
            sim.clear(x, y);
        }
        return true;
    }

    for (const [nx, ny, neighbor] of getNeighbors(sim, x, y)) {
        if (neighbor === Materials.EMPTY) continue;
        const nProps = MaterialProps[neighbor];
        if (!nProps) continue;

        // 点燃可燃物
        if (nProps.flammable && Math.random() < 0.1) {
            if (neighbor === Materials.GUNPOWDER) {
                sim.pendingExplosions.push([nx, ny, 5]);
                sim.clear(nx, ny);
            } else {
                sim.set(nx, ny, Materials.FIRE, MaterialProps[Materials.FIRE].maxLife);
            }
        }

        // 融化Ice
        if (neighbor === Materials.ICE && Math.random() < 0.05) {
            sim.set(nx, ny, Materials.WATER, 0);
        }
    }
    return false;
}

// Water: 灭火产生Steam，溶解Salt
function handleWater(sim, x, y) {
    for (const [nx, ny, neighbor] of getNeighbors(sim, x, y)) {
        if (neighbor === Materials.FIRE) {
            sim.set(nx, ny, Materials.STEAM, MaterialProps[Materials.STEAM].maxLife);
            return true; // 水被消耗
        }
        if (neighbor === Materials.SALT && Math.random() < 0.02) {
            sim.clear(nx, ny);
            // 水自身也有小概率消失
            if (Math.random() < 0.3) {
                sim.clear(x, y);
                return true;
            }
        }
    }
    return false;
}

// Lava: 遇水变Stone+Steam，点燃可燃物，融化Ice
function handleLava(sim, x, y) {
    for (const [nx, ny, neighbor] of getNeighbors(sim, x, y)) {
        if (neighbor === Materials.EMPTY) continue;

        // 遇水
        if (neighbor === Materials.WATER) {
            sim.set(x, y, Materials.STONE, 0);
            sim.set(nx, ny, Materials.STEAM, MaterialProps[Materials.STEAM].maxLife);
            return true;
        }

        // 融化Ice
        if (neighbor === Materials.ICE && Math.random() < 0.1) {
            sim.set(nx, ny, Materials.WATER, 0);
        }

        // 点燃可燃物
        const nProps = MaterialProps[neighbor];
        if (nProps && nProps.flammable && Math.random() < 0.05) {
            if (neighbor === Materials.GUNPOWDER) {
                sim.pendingExplosions.push([nx, ny, 5]);
                sim.clear(nx, ny);
            } else {
                sim.set(nx, ny, Materials.FIRE, MaterialProps[Materials.FIRE].maxLife);
            }
        }
    }
    return false;
}

// Acid: 溶解可溶材料
function handleAcid(sim, x, y) {
    for (const [nx, ny, neighbor] of getNeighbors(sim, x, y)) {
        if (neighbor === Materials.EMPTY) continue;
        if (neighbor === Materials.ACID) continue;
        // Acid不溶Stone（太硬）但溶其他可溶材料
        if (neighbor === Materials.STONE) continue;

        const nProps = MaterialProps[neighbor];
        if (nProps && nProps.soluble && Math.random() < 0.04) {
            sim.clear(nx, ny);
            // Acid自身消耗
            if (Math.random() < 0.5) {
                if (Math.random() < 0.3) {
                    sim.set(x, y, Materials.SMOKE, MaterialProps[Materials.SMOKE].maxLife);
                } else {
                    sim.clear(x, y);
                }
                return true;
            }
        }
    }
    return false;
}

// Ice: 冻结相邻Water
function handleIce(sim, x, y) {
    // 检测附近是否有高温源
    for (const [nx, ny, neighbor] of getNeighbors(sim, x, y)) {
        if (neighbor === Materials.FIRE || neighbor === Materials.LAVA) {
            if (Math.random() < 0.03) {
                sim.set(x, y, Materials.WATER, 0);
                return true;
            }
        }
        // 冻结水
        if (neighbor === Materials.WATER && Math.random() < 0.005) {
            sim.set(nx, ny, Materials.ICE, 0);
        }
    }
    return false;
}

// Plant: 接触Water生长
function handlePlant(sim, x, y) {
    for (const [nx, ny, neighbor] of getNeighbors(sim, x, y)) {
        if (neighbor === Materials.WATER && Math.random() < 0.02) {
            // 水变成植物
            sim.set(nx, ny, Materials.PLANT, 0);
            return false;
        }
    }
    return false;
}
