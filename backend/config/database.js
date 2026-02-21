const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipeapp');

    console.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    console.error('💡 提示: 请确保 MongoDB 服务已启动');
    console.error('   macOS: brew services start mongodb-community');
    console.error('   Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    process.exit(1);
  }
};

module.exports = connectDB;
