import React from 'react';
import { cn } from '@/lib/utils';

const FilterBar = ({ selectedCourse, selectedRemainingClasses, onCourseChange, onRemainingClassesChange }) => {
  // 示例课程列表，实际应用中可以从API获取
  const courses = ['少儿钢琴', '成人吉他', '少儿舞蹈', '成人瑜伽', '少儿绘画', '成人书法'];

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-1 whitespace-nowrap">
          课程筛选
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => onCourseChange(e.target.value)}
          className={cn(
            "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          )}
        >
          <option value="">全部课程</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-1 whitespace-nowrap">
          课时余额筛选
        </label>
        <select
          value={selectedRemainingClasses}
          onChange={(e) => onRemainingClassesChange(e.target.value)}
          className={cn(
            "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          )}
        >
          <option value="">全部</option>
          <option value="0">已用完</option>
          <option value="1-10">1-10课时</option>
          <option value="11-20">11-20课时</option>
          <option value="21-50">21-50课时</option>
          <option value="50+">50课时以上</option>
        </select>
      </div>
      
      <div className="flex items-end">
        <button
          onClick={() => {
            onCourseChange('');
            onRemainingClassesChange('');
          }}
          className={cn(
            "px-4 py-2 text-sm text-gray-600 hover:text-gray-800",
            "border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
          )}
        >
          清除筛选
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
