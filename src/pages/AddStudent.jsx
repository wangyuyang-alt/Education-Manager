import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import StudentForm from '../components/StudentForm';
import { studentApi } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

const AddStudent = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 调用API添加学员
      // 确保字段名与数据库一致
      const studentData = {
        ...formData,
        enrollment_date: formData.enrollmentDate
      };
      
      // 删除前端使用的字段名，避免冲突
      delete studentData.enrollmentDate;
      
      const result = await studentApi.createStudent(studentData);
      
      console.log('添加学员成功:', result);
      
      // 显示成功消息，包含自动生成的学号
      alert(`学员添加成功！\n学号：${result.student_id}\n姓名：${result.name}`);
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      
      // 跳转到学员列表页面
      navigate('/students');
    } catch (error) {
      console.error('添加学员失败:', error);
      // 将英文错误信息转换为中文
      let errorMessage = error.message || '添加学员失败，请重试';
      
      // 检查是否为重复学号错误
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        errorMessage = '学号已存在，请使用其他学号';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">添加学员</h1>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* 表单卡片 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <StudentForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="添加学员"
          submitButtonIcon={<Save className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

export default AddStudent;
