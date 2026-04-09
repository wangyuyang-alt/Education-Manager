-- 为所有现有学生增加12课时
UPDATE students 
SET remaining_classes = remaining_classes + 12 
WHERE remaining_classes IS NOT NULL;
