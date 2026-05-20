import { MATERIAL_IDS } from './materials.js';

export const LEVELS = [
    {
        id: 0,
        name: "沙盒模式 (Sandbox)",
        description: "自由创作！不受限制地使用所有材质和工具，探索物理和化学反应。",
        allowedMaterials: Object.values(MATERIAL_IDS), // All allowed
        init: (engine) => {
            engine.clear();
            // Draw a simple border at the bottom
            for (let x = 0; x < engine.width; x++) {
                engine.setCell(x, engine.height - 1, MATERIAL_IDS.STONE);
                engine.setCell(x, engine.height - 2, MATERIAL_IDS.STONE);
            }
        },
        checkVictory: () => {
            return { won: false, message: "" }; // Sandbox never ends
        }
    },
    {
        id: 1,
        name: "关卡 1：烈火救援",
        description: "木质房屋起火了！请选择“水”扑灭所有火焰，并保全至少 40% 的木质结构。",
        allowedMaterials: [
            MATERIAL_IDS.AIR,
            MATERIAL_IDS.STONE,
            MATERIAL_IDS.WATER,
            MATERIAL_IDS.SAND
        ],
        init: (engine) => {
            engine.clear();
            
            // Stone ground
            for (let x = 0; x < engine.width; x++) {
                engine.setCell(x, engine.height - 1, MATERIAL_IDS.STONE);
                engine.setCell(x, engine.height - 2, MATERIAL_IDS.STONE);
            }

            // Build a wooden house
            const hx = 100;
            const hy = 90;
            const hw = 50;
            const hh = 40;

            // Wood walls
            for (let x = hx; x < hx + hw; x++) {
                for (let y = hy; y < hy + hh; y++) {
                    if (x === hx || x === hx + hw - 1 || y === hy || y === hy + hh - 1) {
                        // Keep a door open
                        if (y > hy + hh - 12 && x === hx) continue;
                        engine.setCell(x, y, MATERIAL_IDS.WOOD);
                    }
                }
            }

            // A wood floor inside
            for (let x = hx + 5; x < hx + hw - 5; x++) {
                engine.setCell(x, hy + 20, MATERIAL_IDS.WOOD);
            }

            // Place fire inside the house
            for (let x = hx + 10; x < hx + 20; x++) {
                engine.setCell(x, hy + 18, MATERIAL_IDS.FIRE);
                engine.setCell(x + 15, hy + hh - 3, MATERIAL_IDS.FIRE);
            }

            // Save wood count baseline
            engine.initialWoodCount = 0;
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.WOOD) engine.initialWoodCount++;
            }
        },
        checkVictory: (engine) => {
            let fireCount = 0;
            let woodCount = 0;
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.FIRE) fireCount++;
                if (engine.grid[i] === MATERIAL_IDS.WOOD) woodCount++;
            }

            if (fireCount === 0) {
                const ratio = engine.initialWoodCount > 0 ? (woodCount / engine.initialWoodCount) : 0;
                if (ratio >= 0.40) {
                    return { won: true, message: `成功！大火被扑灭，保全了 ${Math.round(ratio * 100)}% 的木结构！` };
                } else {
                    return { won: false, message: `火焰已熄灭，但房屋烧毁太严重（仅剩 ${Math.round(ratio * 100)}% 木头，要求 >= 40%）。点击重置重试！` };
                }
            }

            if (woodCount === 0) {
                return { won: false, message: "失败：房屋已被付之一炬！点击重置重试。" };
            }

            return { won: false, message: `扑灭所有火焰！当前剩余火像素：${fireCount}，房屋残存率：${Math.round((woodCount / engine.initialWoodCount) * 100)}%` };
        }
    },
    {
        id: 2,
        name: "关卡 2：定向爆破",
        description: "引爆被石墙保护的 TNT 炸药，利用爆炸的威力或火星彻底烧毁上方悬空的木质平台。",
        allowedMaterials: [
            MATERIAL_IDS.AIR,
            MATERIAL_IDS.SPARK,
            MATERIAL_IDS.FIRE,
            MATERIAL_IDS.SAND
        ],
        init: (engine) => {
            engine.clear();
            
            // Stone ground
            for (let x = 0; x < engine.width; x++) {
                engine.setCell(x, engine.height - 1, MATERIAL_IDS.STONE);
                engine.setCell(x, engine.height - 2, MATERIAL_IDS.STONE);
            }

            // Build stone chamber for TNT at bottom center
            const cx = 120;
            const cy = 130;
            
            // Left/right stone walls of chamber
            for (let y = cy - 20; y < cy + 20; y++) {
                for (let x = cx - 15; x < cx - 10; x++) engine.setCell(x, y, MATERIAL_IDS.STONE);
                for (let x = cx + 10; x < cx + 15; x++) engine.setCell(x, y, MATERIAL_IDS.STONE);
            }
            // Bottom stone
            for (let x = cx - 15; x <= cx + 15; x++) {
                for (let y = cy + 18; y <= cy + 22; y++) engine.setCell(x, y, MATERIAL_IDS.STONE);
            }

            // Fill TNT inside chamber
            for (let x = cx - 10; x <= cx + 9; x++) {
                for (let y = cy - 10; y <= cy + 17; y++) {
                    engine.setCell(x, y, MATERIAL_IDS.TNT);
                }
            }

            // Floating wood platforms at the top
            for (let x = 30; x < 210; x++) {
                for (let y = 30; y < 35; y++) {
                    engine.setCell(x, y, MATERIAL_IDS.WOOD);
                }
            }
            for (let x = 70; x < 170; x++) {
                for (let y = 50; y < 54; y++) {
                    engine.setCell(x, y, MATERIAL_IDS.WOOD);
                }
            }
        },
        checkVictory: (engine) => {
            let tntCount = 0;
            let woodCount = 0;
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.TNT) tntCount++;
                if (engine.grid[i] === MATERIAL_IDS.WOOD) woodCount++;
            }

            if (tntCount === 0 && woodCount === 0) {
                return { won: true, message: "太棒了！TNT 已完全引爆，并且上方悬空木平台已被彻底烧毁！" };
            }

            if (tntCount > 0) {
                return { won: false, message: `请引爆 TNT！当前剩余 TNT 像素：${tntCount}` };
            }

            return { won: false, message: `TNT 已炸开，但木质平台尚未烧尽（剩余木像素：${woodCount}）。等待火势蔓延或重试！` };
        }
    },
    {
        id: 3,
        name: "关卡 3：酸液泄漏控制",
        description: "顶部存有强腐蚀性酸液，通过溶解木阀泄露。请使用混凝土（Concrete）或沙子引导/吸收酸液，确保底部的 TNT 弹药库安然无恙且最后屏幕上没有残留酸液。",
        allowedMaterials: [
            MATERIAL_IDS.AIR,
            MATERIAL_IDS.STONE,
            MATERIAL_IDS.CONCRETE,
            MATERIAL_IDS.SAND,
            MATERIAL_IDS.WATER,
            MATERIAL_IDS.FIRE // allowed to burn the valve
        ],
        init: (engine) => {
            engine.clear();

            // Bottom border
            for (let x = 0; x < engine.width; x++) {
                engine.setCell(x, engine.height - 1, MATERIAL_IDS.STONE);
                engine.setCell(x, engine.height - 2, MATERIAL_IDS.STONE);
            }

            // Top Acid tank
            const tx = 60;
            const ty = 15;
            const tw = 120;
            const th = 30;

            // Tank walls (stone)
            for (let x = tx; x < tx + tw; x++) {
                for (let y = ty; y < ty + th; y++) {
                    if (x === tx || x === tx + tw - 1 || y === ty) {
                        engine.setCell(x, y, MATERIAL_IDS.STONE);
                    }
                }
            }
            // Bottom of tank has a wood valve in the middle
            for (let x = tx; x < tx + tw; x++) {
                if (x >= tx + 45 && x <= tx + 75) {
                    engine.setCell(x, ty + th - 1, MATERIAL_IDS.WOOD); // Wood valve
                } else {
                    engine.setCell(x, ty + th - 1, MATERIAL_IDS.STONE);
                }
            }

            // Fill tank with acid
            for (let x = tx + 2; x < tx + tw - 2; x++) {
                for (let y = ty + 2; y < ty + th - 2; y++) {
                    engine.setCell(x, y, MATERIAL_IDS.ACID);
                }
            }

            // Bottom TNT cache
            const bx = 95;
            const by = 135;
            const bw = 50;
            const bh = 20;

            // TNT box walls (Stone)
            for (let x = bx; x < bx + bw; x++) {
                for (let y = by; y < by + bh; y++) {
                    if (x === bx || x === bx + bw - 1 || y === by) {
                        engine.setCell(x, y, MATERIAL_IDS.STONE);
                    }
                }
            }

            // Fill TNT
            for (let x = bx + 2; x < bx + bw - 2; x++) {
                for (let y = by + 2; y < by + bh - 2; y++) {
                    engine.setCell(x, y, MATERIAL_IDS.TNT);
                }
            }

            engine.initialTntCount = 0;
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.TNT) engine.initialTntCount++;
            }
        },
        checkVictory: (engine) => {
            let acidCount = 0;
            let tntCount = 0;
            let valveCount = 0;

            // Scan grid
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.ACID) acidCount++;
                if (engine.grid[i] === MATERIAL_IDS.TNT) tntCount++;
            }

            // Check if wood valve is dissolved
            // Scan the y-coordinate of the valve: 15 + 30 - 1 = 44
            for (let x = 105; x <= 135; x++) {
                if (engine.grid[44 * engine.width + x] === MATERIAL_IDS.WOOD) {
                    valveCount++;
                }
            }

            if (tntCount < engine.initialTntCount * 0.95) {
                return { won: false, message: "失败：炸药库被酸液侵蚀或爆炸！请重置重试。" };
            }

            if (valveCount > 15) {
                return { won: false, message: "请烧毁或溶解上方的木阀以释放酸液！" };
            }

            if (acidCount === 0) {
                return { won: true, message: "太强了！木阀被溶解，所有酸液已被安全阻挡/消耗，炸药库完好无损！" };
            }

            return { won: false, message: `酸液正在溢出！请尽快中和。当前剩余酸液像素：${acidCount}，炸药存留率：${Math.round((tntCount / engine.initialTntCount) * 100)}%` };
        }
    },
    {
        id: 4,
        name: "关卡 4：熔岩炼金",
        description: "利用岩浆（Lava）的高温将下方的沙子熔化为“玻璃”（Glass）。你可以用石头画出滑道来引导熔岩。注意：不要让熔岩接触旁边的水源，否则会凝固成乱石堵塞通道！",
        allowedMaterials: [
            MATERIAL_IDS.AIR,
            MATERIAL_IDS.STONE,
            MATERIAL_IDS.SAND,
            MATERIAL_IDS.FIRE // to burn the plug
        ],
        init: (engine) => {
            engine.clear();

            // Ground
            for (let x = 0; x < engine.width; x++) {
                engine.setCell(x, engine.height - 1, MATERIAL_IDS.STONE);
                engine.setCell(x, engine.height - 2, MATERIAL_IDS.STONE);
            }

            // Lava reservoir at top-left
            const rx = 20;
            const ry = 15;
            const rw = 50;
            const rh = 35;

            for (let x = rx; x < rx + rw; x++) {
                for (let y = ry; y < ry + rh; y++) {
                    if (x === rx || x === rx + rw - 1 || y === ry) {
                        engine.setCell(x, y, MATERIAL_IDS.STONE);
                    }
                }
            }
            // Lava plug (wood)
            for (let x = rx + 15; x < rx + rw - 15; x++) {
                engine.setCell(x, ry + rh - 1, MATERIAL_IDS.WOOD);
            }
            for (let x = rx; x < rx + rw; x++) {
                if (x < rx + 15 || x >= rx + rw - 15) {
                    engine.setCell(x, ry + rh - 1, MATERIAL_IDS.STONE);
                }
            }
            // Fill Lava
            for (let x = rx + 2; x < rx + rw - 2; x++) {
                for (let y = ry + 2; y < ry + rh - 2; y++) {
                    engine.setCell(x, y, MATERIAL_IDS.LAVA);
                }
            }

            // Water barrier on the middle-left (hazard)
            const wx = 30;
            const wy = 80;
            const ww = 40;
            const wh = 20;
            for (let x = wx; x < wx + ww; x++) {
                for (let y = wy; y < wy + wh; y++) {
                    if (x === wx || x === wx + ww - 1 || y === wy || y === wy + wh - 1) {
                        engine.setCell(x, y, MATERIAL_IDS.STONE);
                    } else {
                        engine.setCell(x, y, MATERIAL_IDS.WATER);
                    }
                }
            }

            // Sand target pool at bottom-right
            const sx = 140;
            const sy = 120;
            const sw = 70;
            const sh = 25;
            for (let x = sx; x < sx + sw; x++) {
                for (let y = sy; y < sy + sh; y++) {
                    if (x === sx || x === sx + sw - 1 || y === sy + sh - 1) {
                        engine.setCell(x, y, MATERIAL_IDS.STONE);
                    } else {
                        engine.setCell(x, y, MATERIAL_IDS.SAND);
                    }
                }
            }

            engine.initialWaterCount = 0;
            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.WATER) engine.initialWaterCount++;
            }
        },
        checkVictory: (engine) => {
            let glassCount = 0;
            let waterCount = 0;
            let lavaCount = 0;

            for (let i = 0; i < engine.size; i++) {
                if (engine.grid[i] === MATERIAL_IDS.GLASS) glassCount++;
                if (engine.grid[i] === MATERIAL_IDS.WATER) waterCount++;
                if (engine.grid[i] === MATERIAL_IDS.LAVA) lavaCount++;
            }

            if (waterCount < engine.initialWaterCount * 0.95) {
                return { won: false, message: "失败：熔岩泄露进水源，并使之汽化凝固！请重置重试。" };
            }

            if (glassCount >= 30) {
                return { won: true, message: `大获成功！产生 ${glassCount} 像素的玻璃，水源保存完好，炼金术达成！` };
            }

            return { won: false, message: `请清除木阀并引导熔岩接触沙子。当前玻璃像素：${glassCount} / 30，水源剩余：${Math.round((waterCount / engine.initialWaterCount) * 100)}%` };
        }
    }
];
