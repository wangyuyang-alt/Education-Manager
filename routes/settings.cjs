const express = require('express');
const { body, validationResult } = require('express-validator');
const Settings = require('../models/Settings.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// 获取系统设置
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // 创建默认设置
      settings = new Settings();
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新系统设置
router.put('/', auth, [
  body('schoolName').optional().notEmpty().withMessage('学校名称不能为空'),
  body('maxStudentsPerClass').optional().isInt({ min: 1, max: 100 }).withMessage('每班最大学生数应在1-100之间'),
  body('enableNotifications').optional().isBoolean().withMessage('通知设置必须为布尔值'),
  body('autoBackup').optional().isBoolean().withMessage('自动备份设置必须为布尔值'),
  body('backupFrequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('备份频率选择无效'),
  body('dataRetention').optional().isInt({ min: 30, max: 3650 }).withMessage('数据保留天数应在30-3650之间'),
  body('allowStudentRegistration').optional().isBoolean().withMessage('学生注册设置必须为布尔值'),
  body('requireEmailVerification').optional().isBoolean().withMessage('邮箱验证设置必须为布尔值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    // 更新设置
    Object.assign(settings, req.body);
    await settings.save();

    res.json({
      message: '设置更新成功',
      settings
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 重置为默认设置
router.post('/reset', auth, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (settings) {
      await Settings.findByIdAndDelete(settings._id);
    }

    const newSettings = new Settings();
    await newSettings.save();

    res.json({
      message: '设置已重置为默认值',
      settings: newSettings
    });
  } catch (error) {
    console.error('重置设置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
