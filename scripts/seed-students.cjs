const mongoose = require('mongoose');
const Student = require('../models/Student.cjs');

async function seedStudents() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/student_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('数据库连接成功');

    // 清空现有学生数据
    await Student.deleteMany({});
    console.log('已清空现有学生数据');

    // 创建示例学生数据
    const students = [
      {
        studentId: '2024001',
        name: '张三',
        gender: '男',
        age: 18,
        grade: '高三',
        class: '1班',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        address: '北京市朝阳区',
        enrollmentDate: new Date('2024-01-15')
      },
      {
        studentId: '2024002',
        name: '李四',
        gender: '女',
        age: 17,
        grade: '高二',
        class: '2班',
        phone: '13800138002',
        email: 'lisi@example.com',
        address: '上海市浦东新区',
        enrollmentDate: new Date('2024-02-20')
      },
      {
        studentId: '2024003',
        name: '王五',
        gender: '男',
        age: 16,
        grade: '高一',
        class: '3班',
        phone: '13800138003',
        email: 'wangwu@example.com',
        address: '广州市天河区',
        enrollmentDate: new Date('2024-03-10')
      },
      {
        studentId: '2024004',
        name: '赵六',
        gender: '女',
        age: 18,
        grade: '高三',
        class: '1班',
        phone: '13800138004',
        email: 'zhaoliu@example.com',
        address: '深圳市南山区',
        enrollmentDate: new Date('2024-01-25')
      },
      {
        studentId: '2024005',
        name: '钱七',
        gender: '男',
        age: 17,
        grade: '高二',
        class: '2班',
        phone: '13800138005',
        email: 'qianqi@example.com',
        address: '杭州市西湖区',
        enrollmentDate: new Date('2024-02-15')
      },
      {
        studentId: '2024006',
        name: '孙八',
        gender: '女',
        age: 16,
        grade: '高一',
        class: '3班',
        phone: '13800138006',
        email: 'sunba@example.com',
        address: '南京市鼓楼区',
        enrollmentDate: new Date('2024-03-05')
      },
      {
        studentId: '2024007',
        name: '周九',
        gender: '男',
        age: 18,
        grade: '高三',
        class: '4班',
        phone: '13800138007',
        email: 'zhoujiu@example.com',
        address: '武汉市江汉区',
        enrollmentDate: new Date('2024-01-30')
      },
      {
        studentId: '2024008',
        name: '吴十',
        gender: '女',
        age: 17,
        grade: '高二',
        class: '5班',
        phone: '13800138008',
        email: 'wushi@example.com',
        address: '成都市锦江区',
        enrollmentDate: new Date('2024-02-28')
      }
    ];

    // 插入学生数据
    await Student.insertMany(students);
    console.log(`成功添加 ${students.length} 名学生数据`);

    console.log('学生数据初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('学生数据初始化失败:', error);
    process.exit(1);
  }
}

seedStudents();
