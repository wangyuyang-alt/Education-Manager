const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    default: '示例学校'
  },
  maxStudentsPerClass: {
    type: Number,
    default: 45,
    min: 1,
    max: 100
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  autoBackup: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  dataRetention: {
    type: Number,
    default: 365,
    min: 30,
    max: 3650
  },
  allowStudentRegistration: {
    type: Boolean,
    default: false
  },
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新updatedAt字段
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
