/**
 * 初始化数据库，创建示例数据
 * 运行: node scripts/init-db.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const connectDB = require('../config/database');

const sampleRecipes = [
  {
    title: '元气厚蛋烧 🍳',
    description: '嫩滑多汁，唤醒一整天的活力。',
    emoji: '🍳',
    type: '早餐',
    time: '10 min',
    color: '#FFF7ED',
    ingredients: ['3个 鸡蛋 🥚', '30ml 牛奶 🥛', '适量 盐和葱花 🧂'],
    steps: [
      '鸡蛋打散加入牛奶和葱花。',
      '平底锅刷油，分三次倒入蛋液。',
      '每次卷起后再倒入新蛋液。',
      '切段即可享用。'
    ],
    isPublic: true,
    imageUrl: 'https://images.unsplash.com/photo-1758779527927-56c21385ffce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    title: '蓝莓奇亚籽燕麦 🥣',
    description: '低脂饱腹，减脂期的清爽选择。',
    emoji: '🥣',
    type: '早餐',
    time: '5 min',
    color: '#FFF7ED',
    ingredients: ['50g 燕麦片 🌾', '200ml 无糖酸奶 🥛', '适量 蓝莓和奇亚籽 🫐'],
    steps: [
      '碗中倒入燕麦片和酸奶。',
      '搅拌均匀后静置5分钟让燕麦变软。',
      '铺上新鲜蓝莓和奇亚籽。',
      '拌匀开吃！'
    ],
    isPublic: true,
    imageUrl: 'https://images.unsplash.com/photo-1610406765661-57646c40da59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    title: '照烧鸡腿饭 🍗',
    description: '浓郁酱汁裹着嫩鸡肉，午间充能必备。',
    emoji: '🍗',
    type: '午餐',
    time: '25 min',
    color: '#F5F3FF',
    ingredients: ['2个 鸡腿 🍗', '1碗 米饭 🍚', '照烧汁 🍯', '西兰花 🥦'],
    steps: [
      '鸡腿去骨，鸡皮朝下煎至出油。',
      '倒入照烧汁小火焖煮至浓稠。',
      '西兰花焯水备用。',
      '切块摆盘，淋上汤汁。'
    ],
    isPublic: true,
    imageUrl: 'https://images.unsplash.com/photo-1636401870585-a8852371e84a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    title: '滑蛋虾仁烩饭 🍤',
    description: '鲜美虾仁配上滑嫩鸡蛋，一口入魂。',
    emoji: '🍤',
    type: '午餐',
    time: '15 min',
    color: '#F5F3FF',
    ingredients: ['8只 虾仁 🦐', '2个 鸡蛋 🥚', '1碗 剩米饭 🍚', '少许 淀粉水 🥣'],
    steps: [
      '虾仁炒熟盛出。',
      '蛋液炒至半熟，倒入米饭翻炒。',
      '倒入虾仁和少许淀粉水增加粘稠感。',
      '撒葱花出锅。'
    ],
    isPublic: true,
    imageUrl: 'https://images.unsplash.com/photo-1665199020996-66cfdf8cba00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    title: '暖心番茄面 🍅',
    description: '酸甜开胃，深夜最温柔的抚慰。',
    emoji: '🍅',
    type: '晚餐',
    time: '15 min',
    color: '#EFF6FF',
    ingredients: ['2个 大番茄 🍅', '1把 手擀面 🍜', '1个 鸡蛋 🥚'],
    steps: [
      '番茄切碎炒出汁水。',
      '加入足量开水煮沸。',
      '下入面条煮熟，最后打入蛋花。',
      '加少许盐调味即可。'
    ],
    isPublic: true,
    imageUrl: 'https://images.unsplash.com/photo-1745817078506-bfc70df458b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  }
];

async function initDatabase() {
  try {
    await connectDB();
    
    // 清空现有数据（可选）
    // await Recipe.deleteMany({});
    
    // 插入示例数据
    const existingCount = await Recipe.countDocuments();
    if (existingCount === 0) {
      await Recipe.insertMany(sampleRecipes);
      console.log(`✅ 成功插入 ${sampleRecipes.length} 条示例菜谱`);
    } else {
      console.log(`ℹ️  数据库已有 ${existingCount} 条菜谱，跳过初始化`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
