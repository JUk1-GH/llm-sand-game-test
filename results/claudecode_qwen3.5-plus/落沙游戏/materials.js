// 材质系统定义
// 每种材质包含：颜色、密度、摩擦力、弹性

const Materials = {
    // 沙土类
    sand: {
        name: '沙子',
        color: '#e6c86e',
        density: 1.2,
        friction: 0.3,
        restitution: 0.05,
        category: 'sand'
    },
    soil: {
        name: '土壤',
        color: '#8b4513',
        density: 1.5,
        friction: 0.5,
        restitution: 0.02,
        category: 'sand'
    },

    // 颗粒类
    gravel: {
        name: '砾石',
        color: '#808080',
        density: 2.0,
        friction: 0.4,
        restitution: 0.1,
        category: 'particle'
    },
    rice: {
        name: '米粒',
        color: '#f5f5dc',
        density: 0.8,
        friction: 0.2,
        restitution: 0.15,
        category: 'particle'
    },

    // 金属类
    iron: {
        name: '铁砂',
        color: '#4a4a4a',
        density: 7.8,
        friction: 0.3,
        restitution: 0.2,
        category: 'metal'
    },
    steel: {
        name: '钢珠',
        color: '#c0c0c0',
        density: 8.0,
        friction: 0.2,
        restitution: 0.4,
        category: 'metal'
    },
    copper: {
        name: '铜粒',
        color: '#b87333',
        density: 8.9,
        friction: 0.25,
        restitution: 0.3,
        category: 'metal'
    },
    gold: {
        name: '金沙',
        color: '#ffd700',
        density: 19.3,
        friction: 0.15,
        restitution: 0.25,
        category: 'metal'
    },

    // 玻璃类
    glass: {
        name: '玻璃珠',
        color: 'rgba(200, 230, 255, 0.8)',
        density: 2.5,
        friction: 0.1,
        restitution: 0.5,
        category: 'glass',
        transparent: true
    },
    crystal: {
        name: '水晶',
        color: 'rgba(255, 200, 255, 0.7)',
        density: 2.7,
        friction: 0.05,
        restitution: 0.6,
        category: 'glass',
        transparent: true
    },

    // 橡胶类
    rubber: {
        name: '橡胶',
        color: '#2d2d2d',
        density: 1.1,
        friction: 0.8,
        restitution: 0.7,
        category: 'rubber'
    },
    bouncy: {
        name: '弹力球',
        color: '#ff6b6b',
        density: 0.5,
        friction: 0.3,
        restitution: 0.9,
        category: 'rubber'
    },

    // 特殊材质
    snow: {
        name: '雪花',
        color: '#fffafa',
        density: 0.3,
        friction: 0.1,
        restitution: 0.1,
        category: 'special'
    },
    water: {
        name: '水滴',
        color: 'rgba(100, 150, 255, 0.6)',
        density: 1.0,
        friction: 0.01,
        restitution: 0.1,
        category: 'special',
        transparent: true
    },
    magma: {
        name: '岩浆',
        color: '#ff4500',
        density: 3.0,
        friction: 0.05,
        restitution: 0.2,
        category: 'special',
        glow: true
    },
    diamond: {
        name: '钻石',
        color: 'rgba(180, 220, 255, 0.9)',
        density: 3.5,
        friction: 0.02,
        restitution: 0.4,
        category: 'special',
        transparent: true
    }
};

// 材质分类
const MaterialCategories = {
    sand: { name: '沙土类', materials: ['sand', 'soil'] },
    particle: { name: '颗粒类', materials: ['gravel', 'rice'] },
    metal: { name: '金属类', materials: ['iron', 'steel', 'copper', 'gold'] },
    glass: { name: '玻璃类', materials: ['glass', 'crystal'] },
    rubber: { name: '橡胶类', materials: ['rubber', 'bouncy'] },
    special: { name: '特殊类', materials: ['snow', 'water', 'magma', 'diamond'] }
};

// 颗粒大小预设
const ParticleSizes = {
    small: { radius: 3, name: '小' },
    medium: { radius: 5, name: '中' },
    large: { radius: 8, name: '大' }
};

// 导出供 game.js 使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Materials, MaterialCategories, ParticleSizes };
}
