// 快速测试 MongoDB 连接
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 测试 MongoDB 连接...');
  console.log('连接字符串:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipeapp', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB 连接成功!');
    console.log('主机:', conn.connection.host);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB 连接失败:');
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 可能的原因:');
      console.log('1. MongoDB Atlas 网络访问权限未配置');
      console.log('2. 密码错误');
      console.log('3. 连接字符串格式错误');
    }
    
    process.exit(1);
  }
}

testConnection();
