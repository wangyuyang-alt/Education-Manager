import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit, Trash2, Clock, Loader2, Check } from 'lucide-react';
import { activityApi } from '../lib/api';

const AllActivities = () => {
  // 获取所有活动数据
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['allActivities'],
    queryFn: () => activityApi.getRecentActivities(50) // 获取最近50条活动记录
  });

  // 根据活动类型获取图标
  const getActivityIcon = (type, description) => {
    switch (type) {
      case 'create':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'update':
        // 检查是否为扣课活动
        if (description && description.includes('扣除课时')) {
          return <Check className="h-5 w-5 text-purple-500" />;
        }
        // 其他更新活动使用编辑图标
        return <Edit className="h-5 w-5 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">全部活动记录</h1>
      </div>

      {/* 活动列表 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">加载活动记录失败</p>
            <p className="text-sm text-gray-500 mt-1">请刷新页面重试</p>
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type, activity.description)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800">{activity.description}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTime(activity.created_at)}</span>
                    {activity.performed_by && (
                      <>
                        <span className="mx-2">·</span>
                        <span>{activity.performed_by}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无活动记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllActivities;
