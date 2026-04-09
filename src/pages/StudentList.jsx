import { useQueryClient, useQuery } from '@tanstack/react-query';
import StudentTable from '../components/StudentTable';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import { CheckSquare, Plus, Square, Loader2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { studentApi } from '../lib/api';

const StudentList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedRemainingClasses, setSelectedRemainingClasses] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  
  // 一键考勤相关状态
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedCourseForBatch, setSelectedCourseForBatch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  
  // 续费相关状态
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [studentToRecharge, setStudentToRecharge] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState(10);
  const [isRechargeSubmitting, setIsRechargeSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  // 获取学生数据
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students', page, searchTerm, selectedCourse, selectedRemainingClasses],
    queryFn: () => {
      // 构建筛选参数，确保不传递空字符串给整数类型的字段
      const filterParams = {
        page,
        limit: 10,
        search: searchTerm,
        course_name: selectedCourse
      };
      
      // 只有当课时余额筛选有值时才添加到参数中
      if (selectedRemainingClasses && selectedRemainingClasses !== '') {
        // 处理课时余额范围筛选
        if (selectedRemainingClasses === '0') {
          filterParams.remaining_classes = 0;
        } else if (selectedRemainingClasses === '1-10') {
          filterParams.remaining_classes_min = 1;
          filterParams.remaining_classes_max = 10;
        } else if (selectedRemainingClasses === '11-20') {
          filterParams.remaining_classes_min = 11;
          filterParams.remaining_classes_max = 20;
        } else if (selectedRemainingClasses === '21-50') {
          filterParams.remaining_classes_min = 21;
          filterParams.remaining_classes_max = 50;
        } else if (selectedRemainingClasses === '50+') {
          filterParams.remaining_classes_min = 50;
        }
      }
      
      return studentApi.getStudents(filterParams);
    },
    keepPreviousData: true, // 保持之前的数据，避免页面抖动
    staleTime: 30000 // 30秒内不重新获取数据
  });

  // 获取所有课程列表（用于一键考勤的课程选择）
  const { data: allCoursesData } = useQuery({
    queryKey: ['allCourses'],
    queryFn: async () => {
      try {
        // 获取所有学生数据来提取课程列表
        const result = await studentApi.getStudents({ limit: 1000 });
        // 使用 Set 去重，然后转换为数组
        const courseSet = new Set();
        result.students.forEach(student => {
          if (student.course_name) {
            courseSet.add(student.course_name);
          }
        });
        return Array.from(courseSet);
      } catch (error) {
        console.error('获取课程列表失败:', error);
        return [];
      }
    },
    staleTime: 300000 // 5分钟内不重新获取课程列表
  });

  // 获取一键考勤的学员数据（根据选择的课程从全部数据库中筛选）
  const { data: batchStudentsData, refetch: refetchBatchStudents } = useQuery({
    queryKey: ['batchStudents', selectedCourseForBatch],
    queryFn: async () => {
      if (!selectedCourseForBatch) return [];
      
      try {
        // 从全部数据库中筛选该课程的学生
        const result = await studentApi.getStudents({ 
          limit: 1000,
          course_name: selectedCourseForBatch 
        });
        return result.students;
      } catch (error) {
        console.error('获取一键考勤学员数据失败:', error);
        return [];
      }
    },
    enabled: !!selectedCourseForBatch, // 只有当选择了课程时才执行查询
    keepPreviousData: true // 保持之前的数据
  });

  const students = data?.students || [];
  const pagination = data?.pagination || { current: 1, pages: 1, total: 0 };

  // 从所有课程数据中提取课程列表
  const availableCourses = useMemo(() => {
    return allCoursesData || [];
  }, [allCoursesData]);

  // 根据选择的课程过滤学员（现在从全部数据库中获取）
  const filteredStudentsForBatch = useMemo(() => {
    return batchStudentsData || [];
  }, [batchStudentsData]);

  // 处理全选/取消全选
  const handleSelectAll = () => {
    // 获取所有可选中学员（课时余额大于0）的ID
    const selectableIds = filteredStudentsForBatch
      .filter(student => (student.remaining_classes || 0) > 0)
      .map(student => student.id);
    
    // 检查当前是否所有可选中学员都已被选中
    const allSelected = selectableIds.every(id => selectedStudentIds.includes(id));
    
    if (allSelected) {
      // 如果所有可选中学员都已被选中，则取消全选
      setSelectedStudentIds([]);
    } else {
      // 否则选中所有可选中的学员
      setSelectedStudentIds(selectableIds);
    }
  };

  // 处理单个学员选择
  const handleSelectStudent = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // 处理一键考勤提交
  const handleBatchDeduct = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('请至少选择一个学员');
      return;
    }
    
    setIsBatchSubmitting(true);
    
    try {
      const result = await studentApi.batchDeductClasses(selectedStudentIds);
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      
      // 显示成功提示
      toast.success(result.message || `成功为 ${selectedStudentIds.length} 名学员扣除课时`);
      
      // 关闭弹窗并重置状态
      setIsBatchModalOpen(false);
      setSelectedCourseForBatch('');
      setSelectedStudentIds([]);
    } catch (error) {
      console.error('一键考勤失败:', error);
      toast.error(`一键考勤失败: ${error.message}`);
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  // 处理续费按钮点击
  const handleRecharge = (studentId, studentName) => {
    setStudentToRecharge({ id: studentId, name: studentName });
    setIsRechargeModalOpen(true);
    setRechargeAmount(10); // 默认充值10课时
  };

  // 处理续费提交
  const handleRechargeSubmit = async () => {
    if (!studentToRecharge) return;
    
    // 验证输入
    const amount = parseInt(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的充值数量');
      return;
    }
    
    setIsRechargeSubmitting(true);
    
    try {
      // 调用API进行续费
      await studentApi.rechargeStudent(studentToRecharge.id, amount);
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      
      // 显示成功提示
      toast.success('充值成功！');
      
      // 关闭弹窗并重置状态
      setIsRechargeModalOpen(false);
      setStudentToRecharge(null);
      setRechargeAmount(10);
    } catch (error) {
      console.error('充值失败:', error);
      toast.error(`充值失败: ${error.message}`);
    } finally {
      setIsRechargeSubmitting(false);
    }
  };

  const handleDelete = async (studentId) => {
    setStudentToDelete(studentId);
    setShowDeleteDialog(true);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await studentApi.deleteStudent(studentToDelete);
        refetch();
        // 使用 console.log 替代 alert
        console.log('学员删除成功！');
      } catch (error) {
        console.error('删除学员失败:', error);
        setDeleteError(error.message || '删除学员失败，请重试');
      } finally {
        setShowDeleteDialog(false);
        setStudentToDelete(null);
      }
    }
  };

  const handleEdit = (studentId) => {
    // 导航到编辑页面
    navigate(`/edit-student/${studentId}`);
  };

  const handleView = (studentId) => {
    // 导航到详情页面
    navigate(`/student/${studentId}`);
  };

  const handleDeductClass = async (studentId) => {
    try {
      await studentApi.deductClass(studentId);
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      
      // 显示成功提示
      toast.success('扣课成功！');
    } catch (error) {
      console.error('扣课失败:', error);
      toast.error(`扣课失败: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">学员列表</h1>
        <div className="flex space-x-3">
          {/* 一键考勤按钮 */}
          <button
            onClick={() => {
              setIsBatchModalOpen(true);
              setSelectedCourseForBatch('');
              setSelectedStudentIds([]);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <CheckSquare className="h-4 w-4" />
            <span>一键考勤</span>
          </button>
          
          <Link
            to="/add-student"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>添加学员</span>
          </Link>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <FilterBar
            selectedCourse={selectedCourse}
            selectedRemainingClasses={selectedRemainingClasses}
            onCourseChange={setSelectedCourse}
            onRemainingClassesChange={setSelectedRemainingClasses}
          />
        </div>
      </div>

      {/* 学员表格区域 - 添加加载状态遮罩 */}
      <div className="relative">
        {/* 加载状态遮罩 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="text-gray-700">加载中...</span>
            </div>
          </div>
        )}
        
        {/* 学员表格 */}
        <StudentTable
          students={students}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onView={handleView}
          onDeductClass={handleDeductClass}
          onRecharge={handleRecharge}
        />
      </div>

      {/* 分页 - 调整位置到更显眼的位置 */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex justify-center">
        {pagination.pages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.current === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              上一页
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 border rounded ${
                  pageNum === pagination.current ? 'bg-blue-600 text-white' : ''
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={pagination.current === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这个学员吗？此操作无法撤销。</p>
            
            {/* 删除错误提示 */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700">
                <p>{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 续费确认对话框 */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">确认充值</h3>
            <p className="text-gray-600 mb-4">
              为 <span className="font-medium">{studentToRecharge?.name}</span> 充值课时
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                充值数量
              </label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsRechargeModalOpen(false);
                  setStudentToRecharge(null);
                  setRechargeAmount(10);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleRechargeSubmit}
                disabled={isRechargeSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isRechargeSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>{isRechargeSubmitting ? '处理中...' : '确认充值'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一键考勤弹窗 */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">一键考勤</h3>
              <button
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setSelectedCourseForBatch('');
                  setSelectedStudentIds([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 选择课程下拉菜单 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择课程
              </label>
              <select
                value={selectedCourseForBatch}
                onChange={(e) => {
                  setSelectedCourseForBatch(e.target.value);
                  setSelectedStudentIds([]); // 重置选中的学员
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择课程</option>
                {availableCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 学员列表 */}
            {selectedCourseForBatch && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">
                    {selectedCourseForBatch} 学员列表
                  </h4>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {selectedStudentIds.length === filteredStudentsForBatch.filter(s => (s.remaining_classes || 0) > 0).length ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-1" />
                        取消全选
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-1" />
                        全选
                      </>
                    )}
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {filteredStudentsForBatch.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredStudentsForBatch.map((student) => {
                        const isDisabled = (student.remaining_classes || 0) <= 0;
                        const isChecked = selectedStudentIds.includes(student.id);
                        
                        return (
                          <div 
                            key={student.id} 
                            className={`flex items-center justify-between p-4 hover:bg-gray-50 ${isDisabled ? 'bg-gray-100' : ''}`}
                          >
                            <div className="flex items-center">
                              <button
                                onClick={() => !isDisabled && handleSelectStudent(student.id)}
                                disabled={isDisabled}
                                className={`mr-3 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-gray-500">
                                  学号: {student.student_id || `S${student.id.toString().padStart(6, '0')}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.remaining_classes > 10 ? 'bg-green-100 text-green-800' :
                                student.remaining_classes > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.remaining_classes || 0} 课时
                              </span>
                              {isDisabled && (
                                <p className="text-xs text-red-500 mt-1">余额不足</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      该课程暂无学员
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setSelectedCourseForBatch('');
                  setSelectedStudentIds([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleBatchDeduct}
                disabled={selectedStudentIds.length === 0 || isBatchSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isBatchSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckSquare className="h-4 w-4" />
                )}
                <span>{isBatchSubmitting ? '处理中...' : `确认考勤 (${selectedStudentIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
