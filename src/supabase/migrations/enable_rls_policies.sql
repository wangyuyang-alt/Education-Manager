-- 为学生表启用RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 为用户表启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 为设置表启用RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 为学生表创建策略：允许所有用户读取学生数据
DROP POLICY IF EXISTS "允许所有用户读取学生数据" ON students;
CREATE POLICY "允许所有用户读取学生数据" ON students
  FOR SELECT USING (true);

-- 为学生表创建策略：允许所有用户插入学生数据（修改此处）
DROP POLICY IF EXISTS "允许所有用户插入学生数据" ON students;
CREATE POLICY "允许所有用户插入学生数据" ON students
  FOR INSERT WITH CHECK (true);

-- 为学生表创建策略：允许所有用户更新学生数据（修改此处）
DROP POLICY IF EXISTS "允许所有用户更新学生数据" ON students;
CREATE POLICY "允许所有用户更新学生数据" ON students
  FOR UPDATE USING (true);

-- 为学生表创建策略：允许所有用户删除学生数据（修改此处）
DROP POLICY IF EXISTS "允许所有用户删除学生数据" ON students;
CREATE POLICY "允许所有用户删除学生数据" ON students
  FOR DELETE USING (true);

-- 为用户表创建策略：允许所有用户读取用户数据
DROP POLICY IF EXISTS "允许所有用户读取用户数据" ON users;
CREATE POLICY "允许所有用户读取用户数据" ON users
  FOR SELECT USING (true);

-- 为用户表创建策略：允许认证用户插入用户数据
DROP POLICY IF EXISTS "允许认证用户插入用户数据" ON users;
CREATE POLICY "允许认证用户插入用户数据" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 为用户表创建策略：允许认证用户更新用户数据
DROP POLICY IF EXISTS "允许认证用户更新用户数据" ON users;
CREATE POLICY "允许认证用户更新用户数据" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 为用户表创建策略：允许认证用户删除用户数据
DROP POLICY IF EXISTS "允许认证用户删除用户数据" ON users;
CREATE POLICY "允许认证用户删除用户数据" ON users
  FOR DELETE USING (auth.role() = 'authenticated');

-- 为设置表创建策略：允许所有用户读取设置数据
DROP POLICY IF EXISTS "允许所有用户读取设置数据" ON settings;
CREATE POLICY "允许所有用户读取设置数据" ON settings
  FOR SELECT USING (true);

-- 为设置表创建策略：允许认证用户更新设置数据
DROP POLICY IF EXISTS "允许认证用户更新设置数据" ON settings;
CREATE POLICY "允许认证用户更新设置数据" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 为设置表创建策略：允许认证用户插入设置数据
DROP POLICY IF EXISTS "允许认证用户插入设置数据" ON settings;
CREATE POLICY "允许认证用户插入设置数据" ON settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
