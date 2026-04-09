import React, { useState, useEffect } from 'react';
import { Save, Database, Users, Bell, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../lib/api';

const StudentSettings = () => {
  const [settings, setSettings] = useState({
    school_name: '示例学校',
    max_students_per_class: 45,
    enable_notifications: true,
    auto_backup: true,
    backup_frequency: 'daily',
    data_retention: 365,
    allow_student_registration: false,
    require_email_verification: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null

  const queryClient = useQueryClient();

  // 获取设置数据
  const { data: settingsData, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await settingsApi.getSettings();
        return response;
      } catch (error) {
        console.error('获取设置失败:', error);
        throw error;
      }
    },
    // 添加错误重试机制
    retry: 3,
    retryDelay: 1000
    // ❌ 删除了被废弃的 onSuccess
  });

  // ✅ 新增：使用 useEffect 监听 settingsData 的变化并更新到表单 state 中
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  // 更新设置的mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData) => {
      const response = await settingsApi.updateSettings(settingsData);
      return response;
    },
    onSuccess: (data) => {
      setSaveStatus('success');
      // 重新获取设置数据以确保UI同步
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // 强制重新获取数据
      refetch();
    },
    onError: (error) => {
      console.error('保存设置失败:', error);
      setSaveStatus('error');
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveStatus(null);
    
    try {
      // 调用API更新设置
      updateSettingsMutation.mutate(settings);
    } catch (error) {
      console.error('保存设置失败:', error);
      setSaveStatus('error');
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>加载设置失败: {error.message}</p>
        <p className="mt-2">请确保Supabase项目已正确配置，并且数据库表已创建。</p>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Supabase配置检查步骤:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>确认Supabase项目已创建并运行</li>
            <li>检查Supabase URL和API密钥是否正确</li>
            <li>确保已创建settings表</li>
            <li>验证RLS（行级安全）策略是否正确配置</li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm font-medium text-yellow-800">提示:</p>
            <p className="text-sm text-yellow-700">
              如果使用的是本地开发环境，请确保已运行数据库迁移脚本创建所需的数据表。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
      </div>

      {/* 保存状态提示 */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          <p>设置保存成功！</p>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>保存设置失败，请重试。如果问题持续存在，请检查Supabase RLS策略配置。</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">基本设置</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                学校名称
              </label>
              <input
                type="text"
                name="school_name"
                value={settings.school_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每班最大学生数
              </label>
              <input
                type="number"
                name="max_students_per_class"
                value={settings.max_students_per_class}
                onChange={handleChange}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">通知设置</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  启用系统通知
                </label>
                <p className="text-sm text-gray-500">
                  接收系统重要事件的通知
                </p>
              </div>
              <input
                type="checkbox"
                name="enable_notifications"
                checked={settings.enable_notifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  需要邮箱验证
                </label>
                <p className="text-sm text-gray-500">
                  新用户注册时需要验证邮箱
                </p>
              </div>
              <input
                type="checkbox"
                name="require_email_verification"
                checked={settings.require_email_verification}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* 数据备份设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">数据备份设置</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  启用自动备份
                </label>
                <p className="text-sm text-gray-500">
                  定期自动备份系统数据
                </p>
              </div>
              <input
                type="checkbox"
                name="auto_backup"
                checked={settings.auto_backup}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备份频率
              </label>
              <select
                name="backup_frequency"
                value={settings.backup_frequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                数据保留天数
              </label>
              <input
                type="number"
                name="data_retention"
                value={settings.data_retention}
                onChange={handleChange}
                min="30"
                max="3650"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 用户权限设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">用户权限设置</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  允许学生自主注册
                </label>
                <p className="text-sm text-gray-500">
                  学生可以通过注册页面创建账户
                </p>
              </div>
              <input
                type="checkbox"
                name="allow_student_registration"
                checked={settings.allow_student_registration}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSubmitting ? '保存中...' : '保存设置'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentSettings;
