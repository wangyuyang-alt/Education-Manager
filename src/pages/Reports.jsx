
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { MessageSquare, TrendingUp, Calendar, BookOpen, Search, FileText, Users, AlertTriangle, Info, Download } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Legend, Bar, PieChart, Tooltip, BarChart, CartesianGrid, ResponsiveContainer, Pie, Cell, XAxis, YAxis } from 'recharts';
import { studentApi } from '../lib/api';
// 添加中文字体支持 (采用翻译转英文的策略避免 jsPDF 乱码)
const addChineseFont = (doc) => {
  const chineseFont = {
    '学员统计报告': 'Student Statistics Report',
    '生成时间': 'Generated Time',
    '学员总数': 'Total Students',
    '本月新增': 'New This Month',
    '本周新增': 'New This Week',
    '本季度新增': 'New This Quarter',
    '本年新增': 'New This Year',
    '课程分布': 'Course Distribution',
    '热门课程人数分布': 'Popular Courses Distribution',
    '课时余额不足预警': 'Insufficient Class Hours Warning',
    '预警详情': 'Warning Details',
    '课程名称': 'Course Name',
    '预警人数': 'Warning Count',
    '学员列表': 'Student List',
    '学号': 'Student ID',
    '姓名': 'Name',
    '剩余课时': 'Remaining Classes',
    '暂无数据': 'No Data Available',
    '少儿钢琴': 'Children Piano',
    '成人吉他': 'Adult Guitar',
    '少儿舞蹈': 'Children Dance',
    '成人瑜伽': 'Adult Yoga',
    '少儿绘画': 'Children Painting',
    '成人书法': 'Adult Calligraphy',
    '人': 'students',
    '课时': 'classes'
  };
  
  return {
    translate: (text) => {
      if (!text) return '';
      const str = String(text);
      
      // 1. 优先完整匹配（比如 "少儿钢琴"）
      if (chineseFont[str]) return chineseFont[str];
      
      // 2. 如果没有完整匹配，做兜底的部分替换（防止未预料到的中文出现乱码）
      return str.replace(/人/g, ' students').replace(/课时/g, ' classes');
    }
  };
};

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  // 添加筛选状态
  const [warningFilter, setWarningFilter] = useState({
    course: '少儿钢琴', // 默认值为"少儿钢琴"
    studentId: '',
    name: ''
  });

  // 获取报告数据
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['reports', selectedPeriod],
    queryFn: async () => {
      try {
        const result = await studentApi.getStats();
        
        // 根据选择的周期计算新增学员数
        let recentEnrollments = 0;
        const now = new Date();
        let startDate = new Date();
        
        switch (selectedPeriod) {
          case 'week':
            // 本周
            const day = now.getDay(); // 0是周日，1-6是周一到周六
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一开始
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            // 本月
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            // 本季度
            const quarter = Math.floor((now.getMonth() + 3) / 3);
            startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
            break;
          case 'year':
            // 本年
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            // 默认本月
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        // 获取所有学生数据来计算新增学员
        const allStudentsResult = await studentApi.getStudents({ limit: 1000 });
        const allStudents = allStudentsResult.students;
        
        // 筛选出在起始日期之后入学的学员
        recentEnrollments = allStudents.filter(student => {
          if (!student.enrollment_date) return false;
          const enrollmentDate = new Date(student.enrollment_date);
          return enrollmentDate >= startDate;
        }).length;
        
        return {
          ...result,
          recentEnrollments
        };
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 返回默认数据以避免页面崩溃
        return {
          totalStudents: 0,
          studentsByCourse: [],
          recentEnrollments: 0
        };
      }
    }
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

  const handleExportPDF = () => {
    console.log('导出PDF格式报告');
    
    // 创建PDF文档
    const doc = new jsPDF();
    
    // 添加中文字体支持
    const font = addChineseFont(doc);
    
    // 设置字体（使用内置的Helvetica，并通过翻译解决中文问题）
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text(font.translate('学员统计报告'), 20, 30);
    
    doc.setFontSize(12);
    // 生成时间中的日期可能包含中文，统一切换为标准格式
    const dateStr = new Date().toLocaleDateString('en-US');
    doc.text(`${font.translate('生成时间')}: ${dateStr}`, 20, 50);
    
    // 添加统计数据
    doc.text(`${font.translate('学员总数')}: ${stats?.totalStudents || 0}`, 20, 70);
    
    // 根据选择的周期显示不同的新增学员标题
    let newStudentsLabel = '本月新增';
    switch (selectedPeriod) {
      case 'week':
        newStudentsLabel = '本周新增';
        break;
      case 'quarter':
        newStudentsLabel = '本季度新增';
        break;
      case 'year':
        newStudentsLabel = '本年新增';
        break;
      default:
        newStudentsLabel = '本月新增';
    }
    
    doc.text(`${font.translate(newStudentsLabel)}: ${stats?.recentEnrollments || 0}`, 20, 85);
    
    // 添加课程分布数据
    doc.text(font.translate('热门课程人数分布') + ':', 20, 105);
    let yPosition = 120;
    if (stats?.studentsByCourse && stats.studentsByCourse.length > 0) {
      stats.studentsByCourse.forEach(item => {
        const courseName = item.course_name || item._id;
        // 【修复】将硬编码的"人"翻译成了英文
        doc.text(`${font.translate(courseName)}: ${item.count} ${font.translate('人')}`, 30, yPosition);
        yPosition += 15;
      });
    } else {
      doc.text(font.translate('暂无数据'), 30, yPosition);
    }

    // 添加课时余额不足预警数据
    doc.text(font.translate('课时余额不足预警') + ':', 20, yPosition + 20);
    yPosition += 40;
    
    if (warningStudents && warningStudents.length > 0) {
      // 按课程分组统计预警人数
      const warningByCourse = warningStudents.reduce((acc, student) => {
        const course = student.course_name || '未分配课程';
        acc[course] = (acc[course] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(warningByCourse).forEach(([course, count]) => {
        doc.text(`${font.translate(course)}: ${count} ${font.translate('人')}`, 30, yPosition);
        yPosition += 15;
      });
    } else {
      doc.text(font.translate('暂无数据'), 30, yPosition);
    }
    
    // 保存PDF文件 (为了防止部分浏览器因中文文件名报错，这里也用英文名)
    doc.save('Student_Statistics_Report.pdf');
  };

  const handleExportExcel = () => {
    console.log('导出Excel格式报告');
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建统计数据表
    let newStudentsLabel = '本月新增';
    switch (selectedPeriod) {
      case 'week':
        newStudentsLabel = '本周新增';
        break;
      case 'quarter':
        newStudentsLabel = '本季度新增';
        break;
      case 'year':
        newStudentsLabel = '本年新增';
        break;
      default:
        newStudentsLabel = '本月新增';
    }
    
    const summaryData = [
      ['统计项目', '数值'],
      ['学员总数', stats?.totalStudents || 0],
      [newStudentsLabel, stats?.recentEnrollments || 0],
      ['课程数量', stats?.studentsByCourse?.length || 0]
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, '统计摘要');
    
    // 创建课程分布表
    if (stats?.studentsByCourse && stats.studentsByCourse.length > 0) {
      const courseData = [
        ['课程名称', '学员数', '占比(%)']
      ];
      
      stats.studentsByCourse.forEach(item => {
        const courseName = item.course_name || item._id;
        const percentage = stats.totalStudents ? ((item.count / stats.totalStudents) * 100).toFixed(1) : 0;
        courseData.push([courseName, item.count, percentage]);
      });
      
      const courseWS = XLSX.utils.aoa_to_sheet(courseData);
      XLSX.utils.book_append_sheet(wb, courseWS, '课程分布');
    }

    // 创建课时余额不足预警表
    if (warningStudents && warningStudents.length > 0) {
      const warningData = [
        ['学号', '姓名', '课程名称', '剩余课时']
      ];
      
      warningStudents.forEach(student => {
        warningData.push([
          student.student_id || student.studentId || `S${student.id.toString().padStart(6, '0')}`,
          student.name,
          student.course_name || '未分配课程',
          student.remaining_classes || 0
        ]);
      });
      
      const warningWS = XLSX.utils.aoa_to_sheet(warningData);
      XLSX.utils.book_append_sheet(wb, warningWS, '课时预警');
    }
    
    // 保存Excel文件
    XLSX.writeFile(wb, '学员统计报告.xlsx');
  };

  // 使用 useMemo 优化图表数据处理，避免重复计算
  const chartData = useMemo(() => {
    if (!stats) {
      return {
        totalStudents: 0,
        byCourse: [
          { name: '少儿钢琴', value: 0, color: '#3b82f6' },
          { name: '成人吉他', value: 0, color: '#10b981' },
          { name: '少儿舞蹈', value: 0, color: '#f59e0b' }
        ],
        warning: [
          { name: '少儿钢琴', value: 0, color: '#ef4444' },
          { name: '成人吉他', value: 0, color: '#f97316' },
          { name: '少儿舞蹈', value: 0, color: '#eab308' }
        ]
      };
    }

    // 处理课程分布数据
    const courseData = stats.studentsByCourse?.map(item => ({
      name: item.course_name || item._id,
      value: item.count,
      color: item.course_name === '少儿钢琴' ? '#3b82f6' : 
             item.course_name === '成人吉他' ? '#10b981' : 
             item.course_name === '少儿舞蹈' ? '#f59e0b' : 
             item.course_name === '成人瑜伽' ? '#8b5cf6' : 
             item.course_name === '少儿绘画' ? '#ec4899' : '#06b6d4'
    })) || [];

    // 处理预警数据
    let warningData = [];
    if (warningStudents && warningStudents.length > 0) {
      // 按课程分组统计预警人数
      const warningByCourse = warningStudents.reduce((acc, student) => {
        const course = student.course_name || '未分配课程';
        acc[course] = (acc[course] || 0) + 1;
        return acc;
      }, {});
      
      warningData = Object.entries(warningByCourse).map(([course, count]) => ({
        name: course,
        value: count,
        color: course === '少儿钢琴' ? '#ef4444' : 
               course === '成人吉他' ? '#f97316' : 
               course === '少儿舞蹈' ? '#eab308' : 
               course === '成人瑜伽' ? '#ec4899' : 
               course === '少儿绘画' ? '#8b5cf6' : '#06b6d4'
      }));
    }

    return {
      totalStudents: stats.totalStudents || 0,
      byCourse: courseData,
      warning: warningData
    };
  }, [stats, warningStudents]);

  // 计算课程数量
  const courseCount = chartData.byCourse.filter(c => c.value > 0).length;

  // 获取新增学员的标签文本
  const getNewStudentsLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return '本周新增';
      case 'quarter':
        return '本季度新增';
      case 'year':
        return '本年新增';
      default:
        return '本月新增';
    }
  };

  // 调整预警图表数据，确保最小分度为1，初始最高值为4，并根据实际人数动态调整
  const adjustedWarningData = useMemo(() => {
    if (!chartData.warning || chartData.warning.length === 0) {
      return [];
    }
    
    // 找出最大值
    const maxValue = Math.max(...chartData.warning.map(item => item.value));
    
    // 如果最大值小于4，则设置为4作为初始最高值
    // 如果最大值大于等于4，则使用实际最大值
    const adjustedMaxValue = Math.max(4, maxValue);
    
    // 返回调整后的数据，保持原始数据不变，只用于图表显示
    return chartData.warning.map(item => ({
      ...item,
      // 确保值至少为1，用于显示
      displayValue: Math.max(1, item.value)
    }));
  }, [chartData.warning]);

  // 根据筛选条件过滤预警学员
  const filteredWarningStudents = useMemo(() => {
    if (!warningStudents) return [];
    
    return warningStudents.filter(student => {
      // 课程筛选
      if (warningFilter.course && student.course_name !== warningFilter.course) {
        return false;
      }
      
      // 学号筛选
      if (warningFilter.studentId) {
        const studentId = student.student_id || student.studentId || `S${student.id.toString().padStart(6, '0')}`;
        if (!studentId.includes(warningFilter.studentId)) {
          return false;
        }
      }
      
      // 姓名筛选
      if (warningFilter.name && !student.name.includes(warningFilter.name)) {
        return false;
      }
      
      return true;
    });
  }, [warningStudents, warningFilter]);

  // 处理一键催费话术生成
  const handleGenerateReminder = async (student) => {
    const reminderText = `家长您好，您的孩子【${student.name}】报读的【${student.course_name || '未分配课程'}】目前剩余课时为【${student.remaining_classes || 0}】节。为了不影响后续的上课进度，提醒您及时续费哦！`;
    
    try {
      await navigator.clipboard.writeText(reminderText);
      toast.success('催费话术已复制，可直接粘贴发送给家长微信');
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      toast.error('复制失败，请手动复制话术');
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
        <p>加载报告数据失败: {error.message}</p>
        <p className="mt-2">请确保Supabase项目已正确配置，并且数据库表已创建。</p>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Supabase配置检查步骤:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>确认Supabase项目已创建并运行</li>
            <li>检查Supabase URL和API密钥是否正确</li>
            <li>确保已创建students表</li>
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="inline-block">报告</span>
            <span className="inline-block">中心</span>
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <div className="relative group">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>导出PDF</span>
            </button>
            {/* 提示文本 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              受技术限制，只支持导出英文pdf
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>导出Excel</span>
          </button>
        </div>
      </div>

      {/* 时间周期选择 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            <span className="inline-block">统计</span>
            <span className="inline-block">周期:</span>
          </span>
          <div className="flex space-x-2">
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === 'week' && '本周'}
                {period === 'month' && '本月'}
                {period === 'quarter' && '本季度'}
                {period === 'year' && '本年'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">学员总数</p>
              <p className="text-3xl font-bold text-gray-900">{chartData.totalStudents}</p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">课程数量</p>
              <p className="text-3xl font-bold text-gray-900">{courseCount}</p>
            </div>
            <BookOpen className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{getNewStudentsLabel()}</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.recentEnrollments || 0}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 课程分布饼图 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">热门课程人数分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.byCourse}
                cx="50%"
                cy="50%"
                labelLine={false}
                // 已删除label属性以移除饼图旁边的课程人数占比显示
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.byCourse.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 课时余额不足预警图 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">课时余额不足预警</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adjustedWarningData.length > 0 ? adjustedWarningData : [{ name: '暂无数据', value: 0, color: '#ef4444' }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                domain={[0, 'dataMax']} 
                allowDecimals={false}
                tickCount={adjustedWarningData.length > 0 ? Math.max(4, Math.max(...adjustedWarningData.map(item => item.value))) + 1 : 5}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#ef4444" name="预警人数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">详细统计数据</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  课程名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学员数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  占比
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.byCourse.map((course, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {course.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chartData.totalStudents ? ((course.value / chartData.totalStudents) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 预警详情表格 */}
      {warningStudents && warningStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">课时余额不足预警详情</h2>
          </div>
          
          {/* 添加筛选控件 */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                课程名称
              </label>
              <select
                value={warningFilter.course}
                onChange={(e) => setWarningFilter(prev => ({ ...prev, course: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部课程</option>
                {/* 从预警学员中提取课程列表 */}
                {Array.from(new Set(warningStudents.map(s => s.course_name).filter(Boolean))).map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                学号
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={warningFilter.studentId}
                  onChange={(e) => setWarningFilter(prev => ({ ...prev, studentId: e.target.value }))}
                  placeholder="搜索学号"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={warningFilter.name}
                  onChange={(e) => setWarningFilter(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="搜索姓名"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    课程名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    剩余课时
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWarningStudents.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student_id || student.studentId || `S${student.id.toString().padStart(6, '0')}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.course_name || '未分配课程'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {student.remaining_classes || 0} 课时
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleGenerateReminder(student)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center space-x-1 transition-colors"
                        title="一键催费"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>一键催费</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredWarningStudents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">没有找到符合条件的预警学员</p>
            </div>
          )}
        </div>
      )}

      {/* 报告说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">报告说明</h3>
            <p className="text-sm text-blue-800">
              本报告展示了教培机构的核心统计数据,包括学员总数、课程分布和入学趋势等信息。
              您可以选择不同的统计周期查看数据,并导出为PDF或Excel格式进行保存和分享。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
