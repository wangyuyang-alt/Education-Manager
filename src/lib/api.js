import { supabase } from '@/integrations/supabase/client';
// 学生相关API
export const studentApi = {
  // 获取学生列表
  getStudents: async (params = {}) => {
    const { page = 1, limit = 10, search, course_name, remaining_classes, remaining_classes_min, remaining_classes_max } = params;
    
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });
    
    // 添加搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%`);
    }
    
    // 添加筛选条件
    if (course_name) {
      query = query.eq('course_name', course_name);
    }
    
    // 处理课时余额筛选
    if (remaining_classes !== undefined) {
      query = query.eq('remaining_classes', remaining_classes);
    } else if (remaining_classes_min !== undefined && remaining_classes_max !== undefined) {
      // 范围筛选
      query = query.gte('remaining_classes', remaining_classes_min).lte('remaining_classes', remaining_classes_max);
    } else if (remaining_classes_min !== undefined) {
      // 大于等于筛选（用于"50+"的情况）
      query = query.gte('remaining_classes', remaining_classes_min);
    }
    
    // 添加分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, count, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      students: data,
      pagination: {
        current: page,
        pages: Math.ceil((count || 0) / limit),
        total: count || 0
      }
    };
  },
  
  // 获取单个学生
  getStudent: async (id) => {
    // 验证ID是否为有效整数
    const studentId = parseInt(id, 10);
    if (isNaN(studentId) || studentId <= 0 || studentId > 2147483647) {
      throw new Error('无效的学员ID');
    }
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },
  
  // 创建学生
  createStudent: async (studentData) => {
    // 增强输入验证
    const validatedData = validateStudentData(studentData);
    
    // 生成唯一学号
    const studentId = await generateUniqueStudentId();
    validatedData.student_id = studentId;
    
    const { data, error } = await supabase
      .from('students')
      .insert([validatedData])
      .select()
      .single();
    
    if (error) {
      console.error('创建学生失败:', error);
      throw new Error(error.message);
    }
    
    // 记录活动
    await activityApi.createActivity({
      type: 'create',
      entity_type: 'student',
      entity_id: data.id,
      description: `新增学员：${data.name} (学号: ${data.student_id})`,
      performed_by: '系统管理员' // 在实际应用中，这里应该是当前登录用户的用户名
    });
    
    return data;
  },
  
  // 更新学生
  updateStudent: async (id, studentData) => {
    // 验证ID是否为有效整数
    const studentId = parseInt(id, 10);
    if (isNaN(studentId) || studentId <= 0 || studentId > 2147483647) {
      throw new Error('无效的学员ID');
    }
    
    // 获取更新前的学生信息，用于活动记录
    const { data: oldStudent } = await supabase
      .from('students')
      .select('name, student_id')
      .eq('id', studentId)
      .single();
    
    // 增强输入验证
    const validatedData = validateStudentData(studentData);
    
    const { data, error } = await supabase
      .from('students')
      .update(validatedData)
      .eq('id', studentId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 记录活动
    await activityApi.createActivity({
      type: 'update',
      entity_type: 'student',
      entity_id: id,
      description: `更新学员信息：${oldStudent.name} (学号: ${oldStudent.student_id})`,
      performed_by: '系统管理员' // 在实际应用中，这里应该是当前登录用户的用户名
    });
    
    return data;
  },
  
  // 删除学生
  deleteStudent: async (id) => {
    // 验证ID是否为有效整数
    const studentId = parseInt(id, 10);
    if (isNaN(studentId) || studentId <= 0 || studentId > 2147483647) {
      throw new Error('无效的学员ID');
    }
    
    // 获取删除前的学生信息，用于活动记录
    const { data: student } = await supabase
      .from('students')
      .select('name, student_id')
      .eq('id', studentId)
      .single();
    
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 记录活动
    await activityApi.createActivity({
      type: 'delete',
      entity_type: 'student',
      entity_id: id,
      description: `删除学员：${student.name} (学号: ${student.student_id})`,
      performed_by: '系统管理员' // 在实际应用中，这里应该是当前登录用户的用户名
    });
  },
  
  // 扣课时
  deductClass: async (id) => {
    // 验证ID是否为有效整数
    const studentId = parseInt(id, 10);
    if (isNaN(studentId) || studentId <= 0 || studentId > 2147483647) {
      throw new Error('无效的学员ID');
    }
    
    // 获取当前学生的课时余额
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('name, student_id, remaining_classes')
      .eq('id', studentId)
      .single();
    
    if (fetchError) {
      throw new Error(fetchError.message);
    }
    
    // 检查课时余额是否大于0
    if (student.remaining_classes <= 0) {
      throw new Error('该学员课时余额不足，无法扣课');
    }
    
    // 扣除1课时
    const newRemainingClasses = student.remaining_classes - 1;
    
    const { data, error } = await supabase
      .from('students')
      .update({ remaining_classes: newRemainingClasses })
      .eq('id', studentId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 记录活动
    await activityApi.createActivity({
      type: 'update',
      entity_type: 'student',
      entity_id: id,
      description: `扣除课时：${student.name} (学号: ${student.student_id})，剩余课时: ${newRemainingClasses}`,
      performed_by: '系统管理员' // 在实际应用中，这里应该是当前登录用户的用户名
    });
    
    return data;
  },
  
  // 批量扣课时
  batchDeductClasses: async (studentIds) => {
    try {
      // 验证输入参数
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        throw new Error('学员ID数组不能为空');
      }
      
      // 验证所有ID是否为有效整数
      const invalidIds = studentIds.filter(id => 
        isNaN(parseInt(id, 10)) || parseInt(id, 10) <= 0 || parseInt(id, 10) > 2147483647
      );
      
      if (invalidIds.length > 0) {
        throw new Error(`包含无效的学员ID: ${invalidIds.join(', ')}`);
      }
      
      // 使用 Promise.all 并行处理所有学员的扣课操作
      const results = await Promise.all(
        studentIds.map(async (studentId) => {
          // 获取当前学生的课时余额
          const { data: student, error: fetchError } = await supabase
            .from('students')
            .select('name, student_id, remaining_classes')
            .eq('id', studentId)
            .single();
          
          if (fetchError) {
            throw new Error(`获取学员信息失败 (ID: ${studentId}): ${fetchError.message}`);
          }
          
          // 检查课时余额是否大于0
          if (student.remaining_classes <= 0) {
            throw new Error(`学员 ${student.name} (学号: ${student.student_id}) 课时余额不足，无法扣课`);
          }
          
          // 扣除1课时
          const newRemainingClasses = student.remaining_classes - 1;
          
          const { data, error } = await supabase
            .from('students')
            .update({ remaining_classes: newRemainingClasses })
            .eq('id', studentId)
            .select()
            .single();
          
          if (error) {
            throw new Error(`扣课失败 (ID: ${studentId}): ${error.message}`);
          }
          
          // 记录活动
          await activityApi.createActivity({
            type: 'update',
            entity_type: 'student',
            entity_id: studentId,
            description: `批量扣除课时：${student.name} (学号: ${student.student_id})，剩余课时: ${newRemainingClasses}`,
            performed_by: '系统管理员' // 在实际应用中，这里应该是当前登录用户的用户名
          });
          
          return {
            studentId,
            name: student.name,
            student_id: student.student_id,
            previousClasses: student.remaining_classes,
            newClasses: newRemainingClasses,
            success: true
          };
        })
      );
      
      return {
        success: true,
        message: `成功为 ${results.length} 名学员扣除课时`,
        results
      };
    } catch (error) {
      console.error('批量扣课失败:', error);
      throw error;
    }
  },
  
  // 学员充值
  rechargeStudent: async (id, amount) => {
    // 验证ID是否为有效整数
    const studentId = parseInt(id, 10);
    if (isNaN(studentId) || studentId <= 0 || studentId > 2147483647) {
      throw new Error('无效的学员ID');
    }
    
    // 验证充值数量
    const rechargeAmount = parseInt(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      throw new Error('充值数量必须为正整数');
    }
    
    // 获取当前学生的课时余额
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('name, student_id, remaining_classes')
      .eq('id', studentId)
      .single();
    
    if (fetchError) {
      throw new Error(fetchError.message);
    }
    
    // 计算新的课时余额
    const newRemainingClasses = (student.remaining_classes || 0) + rechargeAmount;
    
    const { data, error } = await supabase
      .from('students')
      .update({ remaining_classes: newRemainingClasses })
      .eq('id', studentId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 记录活动
    await activityApi.createActivity({
      type: 'update',
      entity_type: 'student',
      entity_id: id,
      description: `充值课时：${student.name} (学号: ${student.student_id})，充值数量: ${rechargeAmount}，充值后余额: ${newRemainingClasses}`,
      performed_by: '系统管理员' // 在实际应用中，这里应该是当前登录用户的用户名
    });
    
    return data;
  },
  
  // 获取统计数据
  getStats: async () => {
    try {
      // 获取总学生数
      const { count: totalStudents, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw new Error(countError.message);
      }
      
      // 按课程分组统计
      const { data: studentsByCourse, error: courseError } = await supabase
        .from('students')
        .select('course_name');
      
      if (courseError) {
        throw new Error(courseError.message);
      }
      
      // 在客户端进行分组统计
      const courseCounts = studentsByCourse.reduce((acc, student) => {
        if (student.course_name) {
          acc[student.course_name] = (acc[student.course_name] || 0) + 1;
        }
        return acc;
      }, {});
      
      const studentsByCourseFormatted = Object.entries(courseCounts).map(([course_name, count]) => ({
        course_name,
        count
      }));
      
      // 计算最近入学人数（最近30天）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentEnrollments, error: recentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('enrollment_date', thirtyDaysAgo.toISOString());
      
      if (recentError) {
        throw new Error(recentError.message);
      }
      
      return {
        totalStudents: totalStudents || 0,
        studentsByCourse: studentsByCourseFormatted,
        recentEnrollments: recentEnrollments || 0
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  }
};

// 学生数据验证函数
function validateStudentData(data) {
  // 创建验证后的数据副本
  const validated = { ...data };
  
  // 验证并清理学号
  if (validated.student_id) {
    validated.student_id = String(validated.student_id).trim().substring(0, 20);
  }
  
  // 验证并清理姓名
  if (validated.name) {
    validated.name = String(validated.name).trim().substring(0, 50);
  }
  
  // 验证并清理性别
  if (validated.gender && !['男', '女'].includes(validated.gender)) {
    throw new Error('性别必须是"男"或"女"');
  }
  
  // 验证并清理年龄
  if (validated.age !== undefined && validated.age !== null) {
    const age = Number(validated.age);
    if (isNaN(age) || age < 1 || age > 120) {
      throw new Error('年龄必须是1-120之间的整数');
    }
    validated.age = Math.floor(age);
  }
  
  // 验证并清理课时余额
  if (validated.remaining_classes !== undefined && validated.remaining_classes !== null) {
    const remainingClasses = Number(validated.remaining_classes);
    if (isNaN(remainingClasses) || remainingClasses < 0 || remainingClasses > 999) {
      throw new Error('课时余额必须是0-999之间的整数');
    }
    validated.remaining_classes = Math.floor(remainingClasses);
  }
  
  // 验证并清理联系电话
  if (validated.phone) {
    validated.phone = String(validated.phone).trim();
    if (!/^1[3-9]\d{9}$/.test(validated.phone)) {
      throw new Error('请输入有效的手机号码');
    }
  }
  
  // 验证并清理邮箱
  if (validated.email) {
    validated.email = String(validated.email).trim().substring(0, 100);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validated.email)) {
      throw new Error('请输入有效的邮箱地址');
    }
  }
  
  // 验证并清理地址
  if (validated.address) {
    validated.address = String(validated.address).trim().substring(0, 200);
  }
  
  // 验证并清理入学日期
  if (validated.enrollment_date) {
    const enrollmentDate = new Date(validated.enrollment_date);
    const currentDate = new Date();
    const minDate = new Date('2000-01-01');
    
    if (isNaN(enrollmentDate.getTime())) {
      throw new Error('请输入有效的入学日期');
    }
    
    if (enrollmentDate > currentDate) {
      throw new Error('入学日期不能晚于当前日期');
    }
    
    if (enrollmentDate < minDate) {
      throw new Error('入学日期不能早于2000年');
    }
    
    // 格式化为YYYY-MM-DD
    validated.enrollment_date = enrollmentDate.toISOString().split('T')[0];
  }
  
  return validated;
}

// 生成唯一学号的函数
async function generateUniqueStudentId() {
  try {
    // 获取当前年份后两位
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // 查询数据库中当前年份的学号数量
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .like('student_id', `${currentYear}%`);
    
    if (error) {
      console.error('查询学号数量失败:', error);
      throw new Error('生成学号失败');
    }
    
    // 生成序列号（从1开始）
    const sequence = (count || 0) + 1;
    
    // 格式化学号：年份(2位) + 序列号(4位，不足补零)
    const studentId = `${currentYear}${sequence.toString().padStart(4, '0')}`;
    
    return studentId;
  } catch (error) {
    console.error('生成学号失败:', error);
    throw new Error('生成学号失败，请重试');
  }
}

// 用户相关API
export const userApi = {
  // 用户登录
  login: async (credentials) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .single();
    
    if (error || !data) {
      throw new Error('用户名或密码错误');
    }
    
    // 注意：在生产环境中，应该使用安全的密码验证方式
    // 这里仅作演示，实际应用中请使用bcrypt等加密库
    if (data.password !== credentials.password) {
      throw new Error('用户名或密码错误');
    }
    
    // 更新最后登录时间
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);
    
    return {
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
        role: data.role
      },
      token: 'demo-token' // 在生产环境中应该生成JWT token
    };
  },
  
  // 用户注册
  register: async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }
};

// 设置相关API
export const settingsApi = {
  // 获取设置
  getSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('id', { ascending: true }) // 确保每次拿到的都是同一条（最早/主设置）数据
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116是"未找到数据"错误
        console.error('获取设置失败:', error);
        throw new Error(error.message);
      }
      
      // 如果没有设置数据，返回默认设置
      if (!data) {
        return {
          school_name: '示例学校',
          max_students_per_class: 45,
          enable_notifications: true,
          auto_backup: true,
          backup_frequency: 'daily',
          data_retention: 365,
          allow_student_registration: false,
          require_email_verification: true
        };
      }
      
      return data;
    } catch (error) {
      console.error('获取设置失败:', error);
      throw error;
    }
  },
  
  // 更新设置
  updateSettings: async (settingsData) => {
    try {
      // 防止将 id 和 created_at 写回数据库导致不可预知的报错
      const payload = { ...settingsData };
      delete payload.id;
      delete payload.created_at;

      // 检查是否已有设置数据
      const { data: existingData, error: fetchError } = await supabase
        .from('settings')
        .select('id')
        .order('id', { ascending: true }) // 保持和查询时的排序一致
        .limit(1)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('检查现有设置失败:', fetchError);
        throw new Error(fetchError.message);
      }
      
      let result;
      
      if (existingData) {
        // 更新现有设置
        const { data, error } = await supabase
          .from('settings')
          .update(payload) // 使用剥离了 id 的 payload
          .eq('id', existingData.id)
          .select()
          .single();
        
        if (error) {
          console.error('更新设置失败:', error);
          throw new Error(error.message);
        }
        
        result = data;
      } else {
        // 创建新设置
        const { data, error } = await supabase
          .from('settings')
          .insert([payload])
          .select()
          .single();
        
        if (error) {
          console.error('创建设置失败:', error);
          throw new Error(error.message);
        }
        
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('更新设置失败:', error);
      throw error;
    }
  }
};

// 活动记录相关API
export const activityApi = {
  // 获取最近活动
  getRecentActivities: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('获取活动记录失败:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('获取活动记录失败:', error);
      throw error;
    }
  },
  
  // 创建活动记录
  createActivity: async (activityData) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select()
        .single();
      
      if (error) {
        console.error('创建活动记录失败:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('创建活动记录失败:', error);
      throw error;
    }
  }
};
