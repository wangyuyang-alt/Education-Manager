import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const StudentForm = ({ 
  initialData = {}, 
  onSubmit, 
  isSubmitting = false,
  submitButtonText = '提交',
  submitButtonIcon = null
}) => {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    gender: '', // 初始为空，显示"请选择性别"
    age: '',
    course_name: '',
    remaining_classes: '',
    phone: '',
    email: '',
    address: '',
    enrollmentDate: ''
  });

  // 表单错误状态
  const [errors, setErrors] = useState({});

  // 课程列表
  const courses = ['少儿钢琴', '成人吉他', '少儿舞蹈', '成人瑜伽', '少儿绘画', '成人书法'];

  // 初始化表单数据
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        gender: initialData.gender || '', // 保持为空或设置为已有值
        age: initialData.age || '',
        course_name: initialData.course_name || '',
        remaining_classes: initialData.remaining_classes || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        enrollmentDate: initialData.enrollmentDate || initialData.enrollment_date || ''
      });
    }
  }, [initialData]);

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};

    // 姓名验证
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = '姓名不能为空';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '姓名长度不能超过50个字符';
    }

    // 性别验证
    if (!formData.gender || formData.gender === '') {
      newErrors.gender = '请选择性别';
    }

    // 年龄验证
    if (!formData.age || formData.age === '') {
      newErrors.age = '年龄不能为空';
    } else {
      const age = Number(formData.age);
      if (isNaN(age) || age < 1 || age > 120) {
        newErrors.age = '年龄必须是1-120之间的整数';
      }
    }

    // 课时余额验证
    if (formData.remaining_classes === '') {
      newErrors.remaining_classes = '课时余额不能为空';
    } else {
      const remainingClasses = Number(formData.remaining_classes);
      if (isNaN(remainingClasses) || remainingClasses < 0 || remainingClasses > 999) {
        newErrors.remaining_classes = '课时余额必须是0-999之间的整数';
      }
    }

    // 联系电话验证
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = '联系电话不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = '请输入有效的手机号码';
    }

    // 邮箱验证（可选）
    if (formData.email && formData.email.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = '请输入有效的邮箱地址';
      }
    }

    // 入学日期验证
    if (!formData.enrollmentDate || formData.enrollmentDate === '') {
      newErrors.enrollmentDate = '入学日期不能为空';
    } else {
      const enrollmentDate = new Date(formData.enrollmentDate);
      const currentDate = new Date();
      const minDate = new Date('2000-01-01');
      
      if (isNaN(enrollmentDate.getTime())) {
        newErrors.enrollmentDate = '请输入有效的入学日期';
      } else if (enrollmentDate > currentDate) {
        newErrors.enrollmentDate = '入学日期不能晚于当前日期';
      } else if (enrollmentDate < minDate) {
        newErrors.enrollmentDate = '入学日期不能早于2000年';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 清理并格式化数据
      const submitData = {
        name: formData.name.trim(),
        gender: formData.gender,
        age: Number(formData.age),
        course_name: formData.course_name || null,
        remaining_classes: Number(formData.remaining_classes),
        phone: formData.phone.trim(),
        email: formData.email ? formData.email.trim() : null,
        address: formData.address ? formData.address.trim() : null,
        enrollmentDate: formData.enrollmentDate
      };
      
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 姓名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
            errors.name ? "border-red-500" : "border-gray-300"
          )}
          placeholder="请输入姓名"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* 性别和年龄 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            性别 <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              errors.gender ? "border-red-500" : "border-gray-300"
            )}
          >
            <option value="">请选择性别</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            年龄 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="1"
            max="120"
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              errors.age ? "border-red-500" : "border-gray-300"
            )}
            placeholder="请输入年龄"
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-500">{errors.age}</p>
          )}
        </div>
      </div>

      {/* 课程名称和课时余额 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            报读课程
          </label>
          <select
            name="course_name"
            value={formData.course_name}
            onChange={handleChange}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              errors.course_name ? "border-red-500" : "border-gray-300"
            )}
          >
            <option value="">请选择课程</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
          {errors.course_name && (
            <p className="mt-1 text-sm text-red-500">{errors.course_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            课时余额 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="remaining_classes"
            value={formData.remaining_classes}
            onChange={handleChange}
            min="0"
            max="999"
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              errors.remaining_classes ? "border-red-500" : "border-gray-300"
            )}
            placeholder="请输入课时余额"
          />
          {errors.remaining_classes && (
            <p className="mt-1 text-sm text-red-500">{errors.remaining_classes}</p>
          )}
        </div>
      </div>

      {/* 联系电话 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          联系电话 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
            errors.phone ? "border-red-500" : "border-gray-300"
          )}
          placeholder="请输入手机号码"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* 邮箱 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          邮箱
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
            errors.email ? "border-red-500" : "border-gray-300"
          )}
          placeholder="请输入邮箱地址（可选）"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* 家庭地址 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          家庭地址
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
            errors.address ? "border-red-500" : "border-gray-300"
          )}
          placeholder="请输入家庭地址（可选）"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address}</p>
        )}
      </div>

      {/* 入学日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          入学日期 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="enrollmentDate"
          value={formData.enrollmentDate}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500",
            errors.enrollmentDate ? "border-red-500" : "border-gray-300"
          )}
        />
        {errors.enrollmentDate && (
          <p className="mt-1 text-sm text-red-500">{errors.enrollmentDate}</p>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm",
            "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          )}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            submitButtonIcon
          )}
          <span>{isSubmitting ? '提交中...' : submitButtonText}</span>
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
