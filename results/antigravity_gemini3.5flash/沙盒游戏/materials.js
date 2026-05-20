// Materials definition for the Falling Sand Simulation

export const MATERIAL_IDS = {
    AIR: 0,
    STONE: 1,
    WOOD: 2,
    SAND: 3,
    WATER: 4,
    OIL: 5,
    FIRE: 6,
    LAVA: 7,
    ACID: 8,
    GUNPOWDER: 9,
    TNT: 10,
    STEAM: 11,
    GAS: 12,
    GLASS: 13,
    PLANT: 14,
    ICE: 15,
    CONCRETE: 16,
    SPARK: 17,
    SMOKE: 18,
    ACID_GAS: 19
};

export const MATERIALS = {
    [MATERIAL_IDS.AIR]: {
        id: MATERIAL_IDS.AIR,
        name: "空气",
        category: "empty",
        color: [0, 0, 0, 0], // Transparent
        state: "empty",
        density: 0,
        flammability: 0,
        acidResistance: 1.0,
        description: "空的真空环境。"
    },
    [MATERIAL_IDS.STONE]: {
        id: MATERIAL_IDS.STONE,
        name: "石头",
        category: "solids",
        color: [120, 120, 120, 255],
        colorVariance: 15,
        state: "solid",
        density: 1000,
        flammability: 0,
        acidResistance: 0.2, // Acid can slowly dissolve it
        description: "坚硬的固体，不易被破坏。可以被酸缓慢腐蚀。"
    },
    [MATERIAL_IDS.WOOD]: {
        id: MATERIAL_IDS.WOOD,
        name: "木头",
        category: "solids",
        color: [133, 94, 66, 255],
        colorVariance: 10,
        state: "solid",
        density: 500,
        flammability: 0.15,
        acidResistance: 0.1, // Acid dissolves it easily
        description: "易燃的固体结构，遇到火或岩浆会燃烧。"
    },
    [MATERIAL_IDS.SAND]: {
        id: MATERIAL_IDS.SAND,
        name: "沙子",
        category: "powders",
        color: [225, 191, 126, 255],
        colorVariance: 20,
        state: "powder",
        density: 50,
        flammability: 0,
        acidResistance: 0.4,
        description: "受重力影响的粉末，堆积成沙丘。受岩浆炙烤会熔化为玻璃。"
    },
    [MATERIAL_IDS.WATER]: {
        id: MATERIAL_IDS.WATER,
        name: "水",
        category: "liquids",
        color: [42, 131, 219, 230],
        colorVariance: 10,
        state: "liquid",
        density: 10,
        flammability: 0,
        acidResistance: 0.9,
        description: "流动的液体。能熄灭火焰，遇岩浆会蒸发并产生石头和水蒸气。"
    },
    [MATERIAL_IDS.OIL]: {
        id: MATERIAL_IDS.OIL,
        name: "石油",
        category: "liquids",
        color: [40, 44, 52, 255],
        colorVariance: 5,
        state: "liquid",
        density: 8, // Floats on water
        flammability: 0.8,
        acidResistance: 0.5,
        description: "易燃液体。浮在水面上，遇到火星会剧烈燃烧。"
    },
    [MATERIAL_IDS.FIRE]: {
        id: MATERIAL_IDS.FIRE,
        name: "火焰",
        category: "special",
        color: [240, 90, 40, 255],
        colorVariance: 30,
        state: "fire",
        density: -3,
        flammability: 0,
        acidResistance: 1.0,
        description: "灼热的火焰。会向上窜行并点燃易燃物，生命周期结束后会变成烟雾。"
    },
    [MATERIAL_IDS.LAVA]: {
        id: MATERIAL_IDS.LAVA,
        name: "岩浆",
        category: "liquids",
        color: [230, 60, 10, 255],
        colorVariance: 20,
        state: "liquid",
        density: 30, // Heavier than water/oil, floats on stone
        flammability: 0,
        acidResistance: 0.9,
        description: "极度灼热的流体。会点燃木头、石油，熔化沙子，遇水转化为石头。"
    },
    [MATERIAL_IDS.ACID]: {
        id: MATERIAL_IDS.ACID,
        name: "酸液",
        category: "liquids",
        color: [110, 235, 60, 240],
        colorVariance: 15,
        state: "liquid",
        density: 12,
        flammability: 0,
        acidResistance: 1.0,
        description: "强腐蚀性液体。能溶解绝大多数固体与沙子，产生酸性气体并消耗自身。"
    },
    [MATERIAL_IDS.GUNPOWDER]: {
        id: MATERIAL_IDS.GUNPOWDER,
        name: "火药",
        category: "powders",
        color: [85, 93, 102, 255],
        colorVariance: 15,
        state: "powder",
        density: 45,
        flammability: 0.9,
        acidResistance: 0.2,
        description: "易爆粉末。遇到火、岩浆或爆炸冲击会迅速爆炸并喷射火星。"
    },
    [MATERIAL_IDS.TNT]: {
        id: MATERIAL_IDS.TNT,
        name: "炸药 (TNT)",
        category: "explosives",
        color: [204, 51, 51, 255],
        colorVariance: 5,
        state: "solid",
        density: 600,
        flammability: 0.95,
        acidResistance: 0.3,
        description: "烈性炸药块。遇到火焰或岩浆会引发大规模剧烈爆炸。"
    },
    [MATERIAL_IDS.STEAM]: {
        id: MATERIAL_IDS.STEAM,
        name: "水蒸气",
        category: "gases",
        color: [220, 225, 235, 100],
        colorVariance: 5,
        state: "gas",
        density: -2,
        flammability: 0,
        acidResistance: 1.0,
        description: "轻盈的水蒸气。会向上飘动，生命周期较短，有几率冷凝为水滴。"
    },
    [MATERIAL_IDS.GAS]: {
        id: MATERIAL_IDS.GAS,
        name: "可燃气",
        category: "gases",
        color: [140, 160, 160, 80],
        colorVariance: 10,
        state: "gas",
        density: -1,
        flammability: 0.99,
        acidResistance: 1.0,
        description: "轻于空气的可燃气体。向上漂移，遇到一丁点火星就会瞬间爆燃。"
    },
    [MATERIAL_IDS.GLASS]: {
        id: MATERIAL_IDS.GLASS,
        name: "玻璃",
        category: "solids",
        color: [200, 240, 255, 180],
        colorVariance: 10,
        state: "solid",
        density: 1200,
        flammability: 0,
        acidResistance: 1.0, // Acid resistant
        description: "坚硬且抗酸的固体。通常是沙子遇高温熔融冷凝后的产物。"
    },
    [MATERIAL_IDS.PLANT]: {
        id: MATERIAL_IDS.PLANT,
        name: "植物",
        category: "solids",
        color: [46, 139, 87, 255],
        colorVariance: 25,
        state: "solid",
        density: 400,
        flammability: 0.3,
        acidResistance: 0.1,
        description: "有机植物。吸收水分可以缓慢向四周蔓生，极度易燃。"
    },
    [MATERIAL_IDS.ICE]: {
        id: MATERIAL_IDS.ICE,
        name: "冰块",
        category: "solids",
        color: [165, 222, 228, 200],
        colorVariance: 8,
        state: "solid",
        density: 900,
        flammability: 0,
        acidResistance: 0.8,
        description: "寒冷的固体。靠近火源或热量（岩浆）会迅速融化成水。"
    },
    [MATERIAL_IDS.CONCRETE]: {
        id: MATERIAL_IDS.CONCRETE,
        name: "混凝土",
        category: "powders", // Sort of powder-like behavior but falls straight down
        color: [150, 150, 155, 255],
        colorVariance: 12,
        state: "heavy_powder", // Custom type: falls but doesn't roll or slide sideways
        density: 1500,
        flammability: 0,
        acidResistance: 0.7,
        description: "沉重的粉末。直接向下坠落而不会像沙子一样向两侧滑落，抗酸能力较强。"
    },
    [MATERIAL_IDS.SPARK]: {
        id: MATERIAL_IDS.SPARK,
        name: "火星",
        category: "special",
        color: [255, 215, 0, 255],
        colorVariance: 40,
        state: "gas", // Behaves like gas/particle, travels fast in all directions
        density: -1,
        flammability: 0,
        acidResistance: 1.0,
        description: "飞溅的高温火星，用于引发连锁爆炸或引燃易燃物。"
    },
    [MATERIAL_IDS.SMOKE]: {
        id: MATERIAL_IDS.SMOKE,
        name: "烟雾",
        category: "gases",
        color: [80, 80, 80, 120],
        colorVariance: 10,
        state: "gas",
        density: -1,
        flammability: 0,
        acidResistance: 1.0,
        description: "燃烧产生的烟尘。向上飘散并逐渐稀释淡化直至消失。"
    },
    [MATERIAL_IDS.ACID_GAS]: {
        id: MATERIAL_IDS.ACID_GAS,
        name: "酸气",
        category: "gases",
        color: [150, 240, 100, 90],
        colorVariance: 10,
        state: "gas",
        density: -1,
        flammability: 0,
        acidResistance: 1.0,
        description: "酸液腐蚀固体时释放的有毒酸性气体，会缓慢上升消失。"
    }
};
