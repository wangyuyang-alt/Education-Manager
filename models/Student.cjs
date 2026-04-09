const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['男', '女']
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  grade: {
    type: String,
    required: true,
    enum: ['高一', '高二', '高三']
  },
  class: {
    type: String,
    required: true,
    enum: ['1班', '2班', '3班', '4班', '5班']
  },
  phone: {
    type: String,
    required: true,
    match: /^1[3-9]\d{9}$/
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  address: {
    type: String,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['在读', '休学', '毕业', '退学'],
    default: '在读'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新updatedAt字段
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
studentSchema.index({ name: 'text', studentId: 'text' });
studentSchema.index({ grade: 1, class: 1 });
studentSchema.index({ enrollmentDate: -1 });

module.exports = mongoose.model('Student', studentSchema);
