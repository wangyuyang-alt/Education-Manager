import { HomeIcon, Users, UserPlus, Settings, FileText, Edit, Eye, Activity, Zap } from "lucide-react";
import Index from "./pages/Index.jsx";
import StudentList from "./pages/StudentList.jsx";
import AddStudent from "./pages/AddStudent.jsx";
import StudentSettings from "./pages/StudentSettings.jsx";
import Reports from "./pages/Reports.jsx";
import EditStudent from "./pages/EditStudent.jsx";
import StudentDetail from "./pages/StudentDetail.jsx";
import AllActivities from "./pages/AllActivities.jsx";
import AiMarketing from "./pages/AiMarketing.jsx";

// 导航菜单项（显示在导航栏中）
export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "学员列表",
    to: "/students",
    icon: <Users className="h-4 w-4" />,
    page: <StudentList />,
  },
  {
    title: "添加学员",
    to: "/add-student",
    icon: <UserPlus className="h-4 w-4" />,
    page: <AddStudent />,
  },
  {
    title: "AI 招生助手",
    to: "/ai-marketing",
    icon: <Zap className="h-4 w-4" />,
    page: <AiMarketing />,
  },
  {
    title: "报告中心",
    to: "/reports",
    icon: <FileText className="h-4 w-4" />,
    page: <Reports />,
  },
  {
    title: "系统设置",
    to: "/settings",
    icon: <Settings className="h-4 w-4" />,
    page: <StudentSettings />,
  },
];

// 隐藏路由（不显示在导航栏中，但需要路由匹配）
export const hiddenRoutes = [
  {
    title: "编辑学员",
    to: "/edit-student/:id",
    icon: <Edit className="h-4 w-4" />,
    page: <EditStudent />,
  },
  {
    title: "学员详情",
    to: "/student/:id",
    icon: <Eye className="h-4 w-4" />,
    page: <StudentDetail />,
  },
  {
    title: "全部活动",
    to: "/activities",
    icon: <Activity className="h-4 w-4" />,
    page: <AllActivities />,
  },
];

// 所有路由（用于路由配置）
export const allRoutes = [...navItems, ...hiddenRoutes];
