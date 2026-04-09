import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, BookOpen } from 'lucide-react';
import { studentApi } from '../lib/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState(null);
  const queryClient = useQueryClient();

  // 获取学生详情
  const { data: student, isLoading, error } = useQuery({
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

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个学员吗？')) {
      try {
        // 确保id是有效的数字
        const studentId = parseInt(id, 10);
        if (isNaN(studentId)) {
          throw new Error('无效的学员ID');
        }
        
        await studentApi.deleteStudent(studentId);
        
        // 刷新相关查询
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
        
        alert('学员删除成功！');
        navigate('/students');
      } catch (error) {
        console.error('删除学员失败:', error);
        setDeleteError(error.message || '删除学员失败，请重试');
      }
    }
  };

  // 格式化日期函数
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>加载学员详情失败: {error.message}</p>
        <button 
          onClick={() => navigate('/students')}
          className="mt-2 text-blue-600 hover:underline"
        >
          返回学员列表
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>未找到学员信息</p>
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
        <h1 className="text-2xl font-bold text-gray-900">学员详情</h1>
      </div>

      {/* 删除错误提示 */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>{deleteError}</p>
        </div>
      )}

      {/* 学员信息卡片 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{student.name}</h2>
            <p className="text-gray-600">
              学号: {student.student_id || `S${student.id.toString().padStart(6, '0')}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">性别</p>
              <p className="font-medium">{student.gender}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">年龄</p>
              <p className="font-medium">{student.age} 岁</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">报读课程</p>
              <p className="font-medium">{student.course_name || '-'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">课时余额</p>
              <p className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.remaining_classes > 10 ? 'bg-green-100 text-green-800' :
                  student.remaining_classes > 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {student.remaining_classes || 0} 课时
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">联系电话</p>
              <p className="font-medium">{student.phone}</p>
            </div>
          </div>

          {student.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">入学日期</p>
              <p className="font-medium">{formatDate(student.enrollment_date || student.enrollmentDate)}</p>
            </div>
          </div>

          {student.address && (
            <div className="flex items-start space-x-3 md:col-span-2">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">家庭地址</p>
                <p className="font-medium">{student.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate(`/edit-student/${id}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>编辑</span>
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>删除</span>
        </button>
      </div>
    </div>
  );
};

export default StudentDetail;
