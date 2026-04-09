const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Student = require('../models/Student.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// 获取所有学生（带分页、搜索、筛选）
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('grade').optional().isIn(['高一', '高二', '高三']),
  query('class').optional().isIn(['1班', '2班', '3班', '4班', '5班'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = {};
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.grade) {
      query.grade = req.query.grade;
    }
    
    if (req.query.class) {
      query.class = req.query.class;
    }

    // 执行查询
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个学生详情
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: '学生不存在' });
    }
    res.json(student);
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建学生
router.post('/', auth, [
  body('studentId').notEmpty().withMessage('学号不能为空'),
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('gender').isIn(['男', '女']).withMessage('性别必须为男或女'),
  body('age').isInt({ min: 1, max: 100 }).withMessage('年龄必须在1-100之间'),
  body('grade').isIn(['高一', '高二', '高三']).withMessage('年级选择无效'),
  body('class').isIn(['1班', '2班', '3班', '4班', '5班']).withMessage('班级选择无效'),
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('enrollmentDate').isISO8601().withMessage('入学日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 检查学号是否已存在
    const existingStudent = await Student.findOne({ studentId: req.body.studentId });
    if (existingStudent) {
      return res.status(400).json({ message: '学号已存在' });
    }

    const student = new Student(req.body);
    await student.save();
    
    res.status(201).json({
      message: '学生创建成功',
      student
    });
  } catch (error) {
    console.error('创建学生失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新学生
router.put('/:id', auth, [
  body('studentId').optional().notEmpty().withMessage('学号不能为空'),
  body('name').optional().notEmpty().withMessage('姓名不能为空'),
  body('gender').optional().isIn(['男', '女']).withMessage('性别必须为男或女'),
  body('age').optional().isInt({ min: 1, max: 100 }).withMessage('年龄必须在1-100之间'),
  body('grade').optional().isIn(['高一', '高二', '高三']).withMessage('年级选择无效'),
  body('class').optional().isIn(['1班', '2班', '3班', '4班', '5班']).withMessage('班级选择无效'),
  body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('enrollmentDate').optional().isISO8601().withMessage('入学日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: '学生不存在' });
    }

    // 如果更新了学号，检查是否重复
    if (req.body.studentId && req.body.studentId !== student.studentId) {
      const existingStudent = await Student.findOne({ studentId: req.body.studentId });
      if (existingStudent) {
        return res.status(400).json({ message: '学号已存在' });
      }
    }

    Object.assign(student, req.body);
    await student.save();

    res.json({
      message: '学生更新成功',
      student
    });
  } catch (error) {
    console.error('更新学生失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除学生
router.delete('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: '学生不存在' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取统计数据
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const studentsByGrade = await Student.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } }
    ]);
    const studentsByClass = await Student.aggregate([
      { $group: { _id: '$class', count: { $sum: 1 } } }
    ]);
    const recentEnrollments = await Student.countDocuments({
      enrollmentDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalStudents,
      studentsByGrade,
      studentsByClass,
      recentEnrollments
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
