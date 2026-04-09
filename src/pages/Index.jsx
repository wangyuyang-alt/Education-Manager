import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StudentTable from '../components/StudentTable';
import { UserPlus, BookOpen, FileText, Users, CheckSquare, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import RecentActivity from '../components/RecentActivity';
import StatsCard from '../components/StatsCard';
import React from 'react';
import { studentApi } from '../lib/api';

const Index = () => {
  // 获取统计数据
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: studentApi.getStats
  });

  // 获取课时余额不足的学员数据
  const { data: warningStudents } = useQuery({
    queryKey: ['warningStudents'],
    queryFn: async () => {
      try {
        // 获取所有学生数据
        const result = await studentApi.getStudents({ limit: 1000 });
        // 筛选出课时余额不足3课时的学生
        return result.students.filter(student => 
          student.remaining_classes !== undefined && 
          student.remaining_classes !== null && 
          student.remaining_classes <= 3
        );
      } catch (error) {
        console.error('获取预警学员数据失败:', error);
        return [];
      }
    }
  });

  // 处理统计数据
  const statsCards = [
    {
      title: '总学员数',
      value: stats?.totalStudents || 0,
      icon: <Users className="h-8 w-8 text-blue-600" />,
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: '本月新增',
      value: stats?.recentEnrollments || 0,
      icon: <UserPlus className="h-8 w-8 text-green-600" />,
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: '活跃学员',
      value: stats?.totalStudents ? Math.round(stats.totalStudents * 0.95) : 0,
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      change: '+3%',
      changeType: 'increase'
    },
    {
      title: '预警学员',
      value: warningStudents?.length || 0,
      icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
      change: '+5%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 whitespace-nowrap">欢迎使用教育轻管家</h1>
        <p className="text-blue-100 text-sm md:text-lg whitespace-nowrap">
          高效管理信息,赋能教育工作
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>加载统计数据失败: {error.message}</p>
            <p className="mt-2">请确保Supabase项目已正确配置,并且数据库表已创建。</p>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Supabase配置检查步骤:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>确认Supabase项目已创建并运行</li>
                <li>检查Supabase URL和API密钥是否正确</li>
                <li>确保已创建students、users和settings表</li>
                <li>验证RLS(行级安全)策略是否正确配置</li>
              </ol>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-medium text-yellow-800">提示:</p>
                <p className="text-sm text-yellow-700">
                  如果使用的是本地开发环境,请确保已运行数据库迁移脚本创建所需的数据表。
                </p>
              </div>
            </div>
          </div>
        ) : (
          statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))
        )}
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/add-student"
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <UserPlus className="h-6 w-6" />
              <h3 className="font-semibold">添加学员</h3>
              <p className="text-sm opacity-90">快速添加新学员信息</p>
            </div>
          </Link>
          
          <Link
            to="/students"
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <Users className="h-6 w-6" />
              <h3 className="font-semibold">查看学员</h3>
              <p className="text-sm opacity-90">浏览所有学员信息</p>
            </div>
          </Link>
          
          <Link
            to="/reports"
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <FileText className="h-6 w-6" />
              <h3 className="font-semibold">生成报告</h3>
              <p className="text-sm opacity-90">导出学员统计报告</p>
            </div>
          </Link>
          
          <Link
            to="/ai-marketing"
            className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <Zap className="h-6 w-6" />
              <h3 className="font-semibold">AI招生助手</h3>
              <p className="text-sm opacity-90">智能生成招生文案</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 最近活动 */}
      <RecentActivity />

      {/* 项目说明 */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">关于教育轻管家</h2>
        <div className="text-gray-700 space-y-2">
          <p>
            大型公立学校有昂贵的定制教务系统，但现在有大量的独立教师无法负担复杂笨重的企业级教务系统，通常用 Excel 甚至纸笔乱记，极易出错且效率低下。
          </p>
          <p>
            我们看到了当前这个群体的窘境，希望用这个轻量级的教育管家来为这部分有需求的人赋能。
            这个系统还在完善中，欢迎提出建议！
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
