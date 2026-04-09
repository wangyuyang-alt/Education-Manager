# 学生管理系统 API 文档

## 基础信息
- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON

## 认证接口

### 用户登录
```
POST /auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "message": "登录成功",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "admin",
    "email": "admin@example.com",
    "name": "系统管理员",
    "role": "admin"
  }
}
```

### 用户注册
```
POST /auth/register
```

**请求体**:
```json
{
  "username": "teacher1",
  "email": "teacher1@example.com",
  "password": "password123",
  "name": "张老师",
  "role": "teacher"
}
```

## 学生管理接口

### 获取学生列表
```
GET /students
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `search`: 搜索关键词
- `grade`: 年级筛选
- `class`: 班级筛选

**响应**:
```json
{
  "students": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

### 创建学生
```
POST /students
```

**请求体**:
```json
{
  "studentId": "2024001",
  "name": "张三",
  "gender": "男",
  "age": 18,
  "grade": "高三",
  "class": "1班",
  "phone": "13800138001",
  "email": "zhangsan@example.com",
  "address": "北京市朝阳区",
  "enrollmentDate": "2024-01-15"
}
```

### 更新学生
```
PUT /students/:id
```

**请求体**: 同上

### 删除学生
```
DELETE /students/:id
```

### 获取学生详情
```
GET /students/:id
```

### 获取统计数据
```
GET /students/stats/summary
```

**响应**:
```json
{
  "totalStudents": 1234,
  "studentsByGrade": [
    { "_id": "高一", "count": 400 },
    { "_id": "高二", "count": 420 },
    { "_id": "高三", "count": 414 }
  ],
  "studentsByClass": [...],
  "recentEnrollments": 56
}
```

## 系统设置接口

### 获取系统设置
```
GET /settings
```

### 更新系统设置
```
PUT /settings
```

**请求体**:
```json
{
  "schoolName": "示例学校",
  "maxStudentsPerClass": 45,
  "enableNotifications": true,
  "autoBackup": true,
  "backupFrequency": "daily",
  "dataRetention": 365,
  "allowStudentRegistration": false,
  "requireEmailVerification": true
}
```

### 重置系统设置
```
POST /settings/reset
```

## 错误码

- `400`: 请求参数错误
- `401`: 未授权访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用说明

1. 首先通过登录接口获取JWT token
2. 在后续请求的Header中添加: `Authorization: Bearer <token>`
3. 所有POST/PUT请求的请求体格式为JSON
4. 分页参数可选，默认返回第一页，每页10条数据
