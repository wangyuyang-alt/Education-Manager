-- 为设置表创建策略：允许所有用户更新设置数据（修复权限问题）
DROP POLICY IF EXISTS "允许所有用户更新设置数据" ON settings;
CREATE POLICY "允许所有用户更新设置数据" ON settings
  FOR UPDATE USING (true);

-- 为设置表创建策略：允许所有用户插入设置数据（修复权限问题）
DROP POLICY IF EXISTS "允许所有用户插入设置数据" ON settings;
CREATE POLICY "允许所有用户插入设置数据" ON settings
  FOR INSERT WITH CHECK (true);
