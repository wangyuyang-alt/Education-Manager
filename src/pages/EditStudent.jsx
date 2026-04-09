import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import StudentForm from '../components/StudentForm';
import { studentApi } from '../lib/api';

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // 获取学员详情
  const { data: student, isLoading, error: fetchError } = useQuery({
    queryKey: ['student', id],
    queryFn: () => {
      // 确保id是有效的数字
      const studentId = parseInt(id, 10);
      if (isNaN(studentId)) {
        throw new Error('无效的学员ID');
      }
      return studentApi.getStudent(studentId);
    },
    enabled: !!id && !isNaN(parseInt(id, 10)) // 只有当id存在且为有效数字时才执行查询
  });

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 确保id是有效的数字
      const studentId = parseInt(id, 10);
      if (isNaN(studentId)) {
        throw new Error('无效的学员ID');
      }
      
      // 调用API更新学员信息
      // 确保字段名与数据库一致
      const updateData = {
        ...formData,
        enrollment_date: formData.enrollmentDate
      };
      
      // 删除前端使用的字段名，避免冲突
      delete updateData.enrollmentDate;
      
      const result = await studentApi.updateStudent(studentId, updateData);
      
      console.log('更新学员成功:', result);
      
      // 显示成功消息
      alert('学员信息更新成功！');
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      
      // 跳转到学员列表页面
      navigate('/students');
    } catch (error) {
      console.error('更新学员失败:', error);
      // 将英文错误信息转换为中文
      let errorMessage = error.message || '更新学员失败，请重试';
      
      // 检查是否为重复学号错误
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        errorMessage = '学号已存在，请使用其他学号';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>加载学员信息失败: {fetchError.message}</p>
        <button 
          onClick={() => navigate('/students')}
          className="mt-2 text-blue-600 hover:underline"
        >
          返回学员列表
        </button>
      </div>
    );
  }

  // 添加数据存在性检查
  if (!student) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        <p>正在加载学员信息...</p>
        <button 
          onClick={() => navigate('/students')}
          className="mt-2 text-blue-600 hover:underline"
        >
          返回学员列表
        </button>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">编辑学员</h1>
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
          initialData={{
            ...student,
            enrollmentDate: student.enrollment_date || ''
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="保存更改"
          submitButtonIcon={<Save className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

export default EditStudent;
