/**
 * Falling Sand Simulator — Material Definitions
 * All material types, their properties, and color palettes
 */

// Material type enum
const MaterialType = {
    EMPTY:     0,
    SAND:      1,
    WATER:     2,
    STONE:     3,
    FIRE:      4,
    SMOKE:     5,
    OIL:       6,
    LAVA:      7,
    PLANT:     8,
    ACID:      9,
    STEAM:     10,
    ICE:       11,
    WOOD:      12,
    GUNPOWDER: 13,
    SALT:      14,
    WALL:      15,
};

// Material definitions with display info and color palettes
const Materials = {
    [MaterialType.EMPTY]: {
        name: 'empty',
        label: '空气',
        desc: '空',
        category: 'none',
        colors: [[10, 14, 23, 255]],
    },
    [MaterialType.SAND]: {
        name: 'sand',
        label: '沙子',
        desc: '细碎的沙粒，受重力影响下落，会形成堆积',
        category: 'powder',
        shortcut: '1',
        colors: [
            [226, 184, 87, 255],
            [214, 170, 70, 255],
            [201, 160, 61, 255],
            [237, 196, 100, 255],
            [193, 150, 52, 255],
        ],
        props: '密度: 高 | 类型: 粉末',
    },
    [MaterialType.WATER]: {
        name: 'water',
        label: '水',
        desc: '液态水，会流动和填充容器，可以蒸发和结冰',
        category: 'liquid',
        shortcut: '2',
        colors: [
            [59, 130, 246, 200],
            [37, 99, 235, 200],
            [96, 165, 250, 200],
            [29, 78, 216, 200],
            [79, 148, 255, 200],
        ],
        props: '密度: 低 | 类型: 液体',
    },
    [MaterialType.STONE]: {
        name: 'stone',
        label: '石头',
        desc: '坚硬的石块，不会移动，不会被酸腐蚀以外的方式破坏',
        category: 'solid',
        shortcut: '3',
        colors: [
            [107, 114, 128, 255],
            [75, 85, 99, 255],
            [156, 163, 175, 255],
            [82, 92, 108, 255],
            [130, 140, 155, 255],
        ],
        props: '密度: 极高 | 类型: 静态固体',
    },
    [MaterialType.FIRE]: {
        name: 'fire',
        label: '火',
        desc: '燃烧的火焰，会上升并点燃可燃物质，有限寿命',
        category: 'gas',
        shortcut: '4',
        colors: [
            [249, 115, 22, 255],
            [239, 68, 68, 255],
            [251, 191, 36, 255],
            [245, 158, 11, 255],
            [220, 38, 38, 255],
            [255, 220, 50, 255],
        ],
        props: '温度: 800°C | 类型: 气态',
    },
    [MaterialType.SMOKE]: {
        name: 'smoke',
        label: '烟雾',
        desc: '轻飘的烟雾，向上飘散，逐渐消散',
        category: 'gas',
        shortcut: '5',
        colors: [
            [107, 114, 128, 120],
            [156, 163, 175, 100],
            [75, 85, 99, 130],
            [128, 138, 150, 110],
        ],
        props: '密度: 极低 | 类型: 气态',
    },
    [MaterialType.OIL]: {
        name: 'oil',
        label: '油',
        desc: '可燃液体，比水轻，接触火焰会剧烈燃烧',
        category: 'liquid',
        shortcut: '6',
        colors: [
            [113, 63, 18, 220],
            [146, 64, 14, 220],
            [69, 26, 3, 220],
            [120, 75, 25, 220],
        ],
        props: '密度: 低 | 类型: 可燃液体',
    },
    [MaterialType.LAVA]: {
        name: 'lava',
        label: '岩浆',
        desc: '高温熔岩，流动缓慢，遇水变石头并产生蒸汽',
        category: 'liquid',
        shortcut: '7',
        colors: [
            [220, 38, 38, 255],
            [249, 115, 22, 255],
            [185, 28, 28, 255],
            [234, 88, 12, 255],
            [255, 60, 20, 255],
        ],
        props: '温度: 1200°C | 类型: 熔融液体',
    },
    [MaterialType.PLANT]: {
        name: 'plant',
        label: '植物',
        desc: '绿色植物，接触水会生长繁殖，可以被火点燃',
        category: 'solid',
        shortcut: '8',
        colors: [
            [22, 163, 74, 255],
            [34, 197, 94, 255],
            [21, 128, 61, 255],
            [5, 150, 60, 255],
            [40, 180, 85, 255],
        ],
        props: '密度: 中 | 类型: 有机固体',
    },
    [MaterialType.ACID]: {
        name: 'acid',
        label: '酸液',
        desc: '腐蚀性液体，会溶解接触到的大部分材质',
        category: 'liquid',
        shortcut: '9',
        colors: [
            [132, 204, 22, 200],
            [163, 230, 53, 200],
            [101, 163, 13, 200],
            [140, 215, 30, 200],
        ],
        props: '密度: 中 | 类型: 腐蚀液体',
    },
    [MaterialType.STEAM]: {
        name: 'steam',
        label: '蒸汽',
        desc: '水蒸气，快速上升，冷却后会凝结回水',
        category: 'gas',
        shortcut: '0',
        colors: [
            [203, 213, 225, 80],
            [226, 232, 240, 60],
            [148, 163, 184, 90],
            [210, 220, 230, 70],
        ],
        props: '温度: 100°C | 类型: 气态',
    },
    [MaterialType.ICE]: {
        name: 'ice',
        label: '冰',
        desc: '冻结的水，会冻结周围的水，遇热融化',
        category: 'solid',
        shortcut: null,
        colors: [
            [147, 197, 253, 230],
            [191, 219, 254, 230],
            [96, 165, 250, 230],
            [170, 210, 255, 230],
        ],
        props: '温度: -20°C | 类型: 固态',
    },
    [MaterialType.WOOD]: {
        name: 'wood',
        label: '木头',
        desc: '可燃的木质材料，比植物更难点燃',
        category: 'solid',
        shortcut: null,
        colors: [
            [146, 64, 14, 255],
            [120, 53, 15, 255],
            [161, 98, 7, 255],
            [133, 58, 12, 255],
        ],
        props: '密度: 中 | 类型: 可燃固体',
    },
    [MaterialType.GUNPOWDER]: {
        name: 'gunpowder',
        label: '火药',
        desc: '危险的爆炸物，接触火焰或岩浆会引发连锁爆炸',
        category: 'powder',
        shortcut: null,
        colors: [
            [55, 65, 81, 255],
            [31, 41, 55, 255],
            [75, 85, 99, 255],
            [45, 55, 70, 255],
        ],
        props: '密度: 中 | 类型: 爆炸粉末',
    },
    [MaterialType.SALT]: {
        name: 'salt',
        label: '盐',
        desc: '白色的盐粒，像沙子一样堆积',
        category: 'powder',
        shortcut: null,
        colors: [
            [241, 245, 249, 255],
            [226, 232, 240, 255],
            [248, 250, 252, 255],
            [215, 225, 235, 255],
        ],
        props: '密度: 高 | 类型: 粉末',
    },
    [MaterialType.WALL]: {
        name: 'wall',
        label: '墙壁',
        desc: '不可破坏的墙壁，任何物质都无法穿过或破坏',
        category: 'solid',
        shortcut: null,
        colors: [
            [55, 65, 81, 255],
            [107, 114, 128, 255],
            [55, 65, 81, 255],
        ],
        props: '类型: 永久固体',
    },
};

// "Eraser" pseudo-material for UI
const ERASER_ID = 99;
Materials[ERASER_ID] = {
    name: 'eraser',
    label: '橡皮擦',
    desc: '清除粒子',
    category: 'tool',
    shortcut: 'E',
    colors: [[10, 14, 23, 255]],
    props: '工具',
};

// Order materials appear in the UI
const MATERIAL_UI_ORDER = [
    MaterialType.SAND,
    MaterialType.WATER,
    MaterialType.STONE,
    MaterialType.FIRE,
    MaterialType.SMOKE,
    MaterialType.OIL,
    MaterialType.LAVA,
    MaterialType.PLANT,
    MaterialType.ACID,
    MaterialType.STEAM,
    MaterialType.ICE,
    MaterialType.WOOD,
    MaterialType.GUNPOWDER,
    MaterialType.SALT,
    MaterialType.WALL,
    ERASER_ID,
];

/**
 * Get a color for a material, with variation
 */
function getMaterialColor(materialType, variation) {
    const mat = Materials[materialType];
    if (!mat) return [10, 14, 23, 255];
    const colors = mat.colors;
    const idx = variation % colors.length;
    return colors[idx];
}

/**
 * Get fire color based on remaining lifetime (hotter = brighter)
 */
function getFireColor(lifetime, maxLifetime, variation) {
    const t = lifetime / maxLifetime;
    const colors = Materials[MaterialType.FIRE].colors;

    if (t > 0.7) {
        // Hot core: yellow-white
        const r = 255;
        const g = 220 + Math.floor(variation % 35);
        const b = 50 + Math.floor(variation % 80);
        return [r, g, b, 255];
    } else if (t > 0.3) {
        // Mid: orange
        return colors[variation % colors.length];
    } else {
        // Dying: dark red
        const r = 150 + Math.floor(variation % 70);
        const g = 20 + Math.floor(variation % 40);
        const b = 10;
        return [r, g, b, 230];
    }
}
