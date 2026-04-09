import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { UserPlus, Edit, Trash2, Clock, Loader2, Check, UserCheck } from 'lucide-react';
import { activityApi } from '../lib/api';

const RecentActivity = () => {
  // 获取最近活动数据
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => activityApi.getRecentActivities(5)
  });

  // 根据活动类型获取图标
  const getActivityIcon = (type, description) => {
    switch (type) {
      case 'create':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'update':
        // 检查是否为扣课活动
        if (description && description.includes('扣除课时')) {
          return <Check className="h-4 w-4 text-purple-500" />;
        }
        // 其他更新活动使用编辑图标
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">最近活动</h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">最近活动</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">加载活动记录失败</p>
          <p className="text-sm text-gray-500 mt-1">请刷新页面重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">最近活动</h2>
        <Link 
          to="/activities" 
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Clock className="h-4 w-4 mr-1" />
          查看全部
        </Link>
      </div>
      
      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type, activity.description)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{activity.description}</p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span>{formatTime(activity.created_at)}</span>
                  {activity.performed_by && (
                    <>
                      <span className="mx-1">·</span>
                      <span>{activity.performed_by}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无最近活动</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
