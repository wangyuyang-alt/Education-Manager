const mongoose = require('mongoose');
const User = require('../models/User.cjs');
const Settings = require('../models/Settings.cjs');

async function initializeDatabase() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/student_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('数据库连接成功');

    // 创建默认管理员用户
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin'
      });
      await admin.save();
      console.log('创建默认管理员用户: admin / admin123');
    }

    // 创建默认设置
    const settings = await Settings.findOne();
    if (!settings) {
      const defaultSettings = new Settings();
      await defaultSettings.save();
      console.log('创建默认系统设置');
    }

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initializeDatabase();
