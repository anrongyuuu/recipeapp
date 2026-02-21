const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  // 基础信息
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  emoji: {
    type: String,
    default: '🍳'
  },
  type: {
    type: String,
    enum: ['早餐', '午餐', '晚餐', '其他'],
    default: '其他'
  },
  time: {
    type: String,
    default: '15 min'
  },
  color: {
    type: String,
    default: '#FFF7ED'
  },
  
  // 内容
  ingredients: [{
    type: String
  }],
  steps: [{
    type: String
  }],
  tips: {
    type: String,
    default: ''
  },
  
  // 媒体
  imageUrl: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  },
  videoSource: {
    type: String, // 视频来源：douyin, bilibili, kuaishou等
    default: ''
  },
  
  // 元数据
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

recipeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Recipe', recipeSchema);
