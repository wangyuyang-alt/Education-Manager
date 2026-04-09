-- 更新学生表结构，移除年级和班级字段，添加课程和课时余额字段
ALTER TABLE students 
DROP COLUMN IF EXISTS grade,
DROP COLUMN IF EXISTS class,
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS remaining_classes INTEGER DEFAULT 0;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_students_course_name ON students(course_name);
CREATE INDEX IF NOT EXISTS idx_students_remaining_classes ON students(remaining_classes);
