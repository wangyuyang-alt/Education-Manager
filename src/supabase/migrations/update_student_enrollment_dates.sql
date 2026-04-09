-- 更新所有学生的入学日期为2025.1.1-2026.3.7之间的随机日期
UPDATE students 
SET enrollment_date = 
  DATE('2025-01-01') + 
  (RANDOM() * (DATE('2026-03-07') - DATE('2025-01-01'))) * INTERVAL '1 day'
WHERE enrollment_date IS NOT NULL;
