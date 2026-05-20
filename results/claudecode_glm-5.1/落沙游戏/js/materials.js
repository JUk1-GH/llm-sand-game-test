// materials.js - 14种材料定义 + 属性表

// 材料枚举
const Materials = {
    EMPTY: 0,
    SAND: 1,
    WATER: 2,
    STONE: 3,
    WOOD: 4,
    FIRE: 5,
    LAVA: 6,
    OIL: 7,
    ACID: 8,
    SALT: 9,
    ICE: 10,
    STEAM: 11,
    SMOKE: 12,
    GUNPOWDER: 13,
    PLANT: 14
};

// 材料属性表
const MaterialProps = {
    [Materials.EMPTY]: {
        name: 'Empty',
        type: 'none',
        density: 0,
        flammable: false,
        soluble: false,
        color: [20, 20, 30]
    },
    [Materials.SAND]: {
        name: 'Sand',
        type: 'powder',
        density: 80,
        flammable: false,
        soluble: false,
        colors: [[194, 178, 128], [189, 174, 122], [199, 183, 133], [204, 188, 138]]
    },
    [Materials.WATER]: {
        name: 'Water',
        type: 'liquid',
        density: 50,
        flammable: false,
        soluble: false,
        spreadRate: 5,
        colors: [[28, 107, 186], [32, 112, 192], [24, 102, 180], [36, 117, 198]]
    },
    [Materials.STONE]: {
        name: 'Stone',
        type: 'solid',
        density: 100,
        flammable: false,
        soluble: true,
        colors: [[128, 128, 128], [122, 122, 122], [134, 134, 134], [116, 116, 116]]
    },
    [Materials.WOOD]: {
        name: 'Wood',
        type: 'solid',
        density: 60,
        flammable: true,
        soluble: true,
        colors: [[101, 67, 33], [96, 62, 28], [106, 72, 38], [91, 57, 23]]
    },
    [Materials.FIRE]: {
        name: 'Fire',
        type: 'gas',
        density: 5,
        flammable: false,
        soluble: false,
        maxLife: 60,
        colors: [[255, 100, 20], [255, 160, 40], [255, 60, 10], [255, 200, 60]]
    },
    [Materials.LAVA]: {
        name: 'Lava',
        type: 'liquid',
        density: 90,
        flammable: false,
        soluble: false,
        spreadRate: 1,
        colors: [[207, 47, 17], [217, 57, 27], [197, 37, 7], [227, 67, 37]]
    },
    [Materials.OIL]: {
        name: 'Oil',
        type: 'liquid',
        density: 30,
        flammable: true,
        soluble: false,
        spreadRate: 3,
        colors: [[64, 48, 32], [60, 44, 28], [68, 52, 36], [56, 40, 24]]
    },
    [Materials.ACID]: {
        name: 'Acid',
        type: 'liquid',
        density: 55,
        flammable: false,
        soluble: false,
        spreadRate: 4,
        colors: [[128, 255, 0], [120, 240, 0], [136, 255, 10], [112, 225, 0]]
    },
    [Materials.SALT]: {
        name: 'Salt',
        type: 'powder',
        density: 75,
        flammable: false,
        soluble: true,
        colors: [[220, 220, 220], [215, 215, 215], [225, 225, 225], [210, 210, 210]]
    },
    [Materials.ICE]: {
        name: 'Ice',
        type: 'solid',
        density: 45,
        flammable: false,
        soluble: true,
        colors: [[160, 200, 240], [155, 195, 235], [165, 205, 245], [150, 190, 230]]
    },
    [Materials.STEAM]: {
        name: 'Steam',
        type: 'gas',
        density: 3,
        flammable: false,
        soluble: false,
        maxLife: 120,
        colors: [[200, 200, 220], [195, 195, 215], [205, 205, 225], [190, 190, 210]]
    },
    [Materials.SMOKE]: {
        name: 'Smoke',
        type: 'gas',
        density: 4,
        flammable: false,
        soluble: false,
        maxLife: 80,
        colors: [[60, 60, 60], [55, 55, 55], [65, 65, 65], [50, 50, 50]]
    },
    [Materials.GUNPOWDER]: {
        name: 'Gunpowder',
        type: 'powder',
        density: 70,
        flammable: true,
        soluble: true,
        colors: [[50, 50, 50], [45, 45, 45], [55, 55, 55], [40, 40, 40]]
    },
    [Materials.PLANT]: {
        name: 'Plant',
        type: 'solid',
        density: 40,
        flammable: true,
        soluble: true,
        colors: [[34, 139, 34], [30, 130, 30], [38, 148, 38], [26, 120, 26]]
    }
};

// 材料UI显示顺序和图标
const MaterialUI = [
    { id: Materials.SAND, name: '沙', key: '1' },
    { id: Materials.SALT, name: '盐', key: '2' },
    { id: Materials.GUNPOWDER, name: '火药', key: '3' },
    { id: Materials.WATER, name: '水', key: '4' },
    { id: Materials.OIL, name: '油', key: '5' },
    { id: Materials.ACID, name: '酸', key: '6' },
    { id: Materials.LAVA, name: '岩浆', key: '7' },
    { id: Materials.STEAM, name: '蒸汽', key: '8' },
    { id: Materials.SMOKE, name: '烟', key: '9' },
    { id: Materials.FIRE, name: '火', key: '0' },
    { id: Materials.STONE, name: '石头', key: 'q' },
    { id: Materials.WOOD, name: '木', key: 'w' },
    { id: Materials.ICE, name: '冰', key: 'e' },
    { id: Materials.PLANT, name: '植物', key: 'r' }
];

// 获取材料颜色（确定性哈希，避免闪烁）
function getColor(materialId, x, y) {
    const props = MaterialProps[materialId];
    if (!props || !props.colors) return props ? props.color : [20, 20, 30];
    // 使用坐标哈希确定颜色变体
    const hash = ((x * 374761393 + y * 668265263) >>> 0) % props.colors.length;
    return props.colors[hash];
}

// 获取材料主色（用于UI显示）
function getMaterialColor(materialId) {
    const props = MaterialProps[materialId];
    if (!props) return [20, 20, 30];
    if (props.colors) return props.colors[0];
    return props.color;
}
