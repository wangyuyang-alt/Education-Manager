const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '未授权访问' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: '用户不存在或已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(401).json({ message: '无效的token' });
  }
};

module.exports = auth;
