import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, FileText, CheckSquare } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      title: '添加学员',
      description: '快速添加新学员信息',
      icon: <UserPlus className="h-6 w-6" />,
      link: '/add-student',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: '查看学员',
      description: '浏览所有学员信息',
      icon: <Users className="h-6 w-6" />,
      link: '/students',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: '生成报告',
      description: '导出学员统计报告',
      icon: <FileText className="h-6 w-6" />,
      link: '/reports',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: '一键考勤',
      description: '批量扣除学员课时',
      icon: <CheckSquare className="h-6 w-6" />,
      link: '/students',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">快速操作</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className={`${action.color} text-white p-4 rounded-lg transition-colors duration-200 transform hover:scale-105`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              {action.icon}
              <h3 className="font-semibold">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
