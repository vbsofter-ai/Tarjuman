"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  ShieldCheck,
  Sliders,
  Database,
  Search,
  Plus,
  Edit2,
  UserCheck,
  UserX,
  Check,
  X,
  Settings,
  AlertTriangle,
  Sparkles,
  Cpu,
  Layers,
  ArrowUpDown,
  RefreshCw,
  FileText,
  Globe,
  Download,
  UserPlus,
  Play,
  Pause,
  Clock,
  Coins,
  Shield,
  Key,
  Lock,
  Trash2,
  LayoutDashboard,
  Eye,
  EyeOff,
  CornerDownLeft,
  ArrowRight,
  Star,
  Zap,
  MessageSquare,
  BarChart3,
  Wifi,
  WifiOff,
  ChevronUp,
  ChevronDown,
  Calendar,
  Target
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  quotaUsed: number;
  quotaLimit: number;
  status: "active" | "suspended";
  joinedDate: string;
  lastActive: string;
  preferredDomain: string;
  role?: "super_admin" | "admin" | "moderator" | "editor" | "user";
  permissions?: string; // JSON string representation of array
}

interface SystemConfig {
  defaultFreeLimit: number;
  translationEngine: string;
  requireAuthForUpload: boolean;
  maintenanceMode: boolean;
  enableLinguisticAnalysis: boolean;
  logTranslationRequests: boolean;
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  totalTranslations: number;
  totalUsers: number;
  dailyTrend: { date: string; visits: number; visitors: number }[];
  pageViews: { path: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  browsers: { browser: string; count: number }[];
}

const ALL_PERMISSIONS = [
  { code: "super_admin", nameAr: "صلاحيات المدير العام الفائقة", nameEn: "Full Super Admin Access" },
  { code: "dashboard", nameAr: "لوحة تحكم المدير", nameEn: "Administrative Dashboard" },
  { code: "users_view", nameAr: "استعراض المستخدمين", nameEn: "View Users Database" },
  { code: "users_manage", nameAr: "إدارة وتعديل المستخدمين", nameEn: "Manage/Edit Users" },
  { code: "config_manage", nameAr: "تغيير الإعدادات العامة", nameEn: "Manage Global Configurations" },
  { code: "logs_view", nameAr: "استعراض سجلات النظام", nameEn: "View System Transaction Logs" },
  { code: "translate", nameAr: "استخدام الترجمة الفورية", nameEn: "Access Translation Services" },
  { code: "upload_files", nameAr: "رفع وترجمة الملفات", nameEn: "Upload & Translate Files" },
  { code: "linguistic_analysis", nameAr: "التبصر والتحليل اللغوي", nameEn: "Use Linguistic & Text Insights" },
  { code: "analytics_view", nameAr: "استعراض تحليلات حركة المرور", nameEn: "View Traffic & Visit Analytics" }
];

const getDefaultPermissionsForRole = (role: string): string[] => {
  switch (role) {
    case "super_admin":
      return ["super_admin", "dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis", "analytics_view"];
    case "admin":
      return ["dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis"];
    case "moderator":
      return ["dashboard", "users_view", "users_manage", "logs_view", "translate", "upload_files"];
    case "editor":
      return ["dashboard", "logs_view", "translate", "upload_files", "linguistic_analysis"];
    case "user":
    default:
      return ["translate", "upload_files"];
  }
};

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isArabic, setIsArabic] = useState(true);
  const [liveClock, setLiveClock] = useState(new Date());
  const [dbConnected, setDbConnected] = useState(true);

  // Live clock tick
  useEffect(() => {
    const clockInterval = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // States for dashboard data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    defaultFreeLimit: 5000,
    translationEngine: "gemini-3.5-flash",
    requireAuthForUpload: true,
    maintenanceMode: false,
    enableLinguisticAnalysis: true,
    logTranslationRequests: true,
  });
  const [liveLogs, setLiveLogs] = useState<{ id: string; time: string; action: string; type: "info" | "success" | "warning"; details: string }[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [feedbacks, setFeedbacks] = useState<{ id: number; timestamp: string; email: string | null; rating: number; comment: string; details: string | null }[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "settings" | "logs" | "feedbacks">("overview");

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "quotaUsed" | "joinedDate">("joinedDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected User for Editing
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    plan: "free",
    quotaLimit: 5000,
    preferredDomain: "general",
    role: "user",
    permissions: ["translate", "upload_files"]
  });

  // Verify authorization on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("tarjuman_current_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        // Strictly restrict access only to Super Admins
        if (user && user.role === "super_admin") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (e) {
        console.error("Failed to parse current user", e);
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }
  }, []);

  // Fetch data
  useEffect(() => {
    if (isAuthorized !== true || !currentUser) return;

    const fetchAllAdminData = async () => {
      setLoading(true);
      const headers = {
        "Content-Type": "application/json",
        "x-admin-email": currentUser.email
      };

      try {
        const [usersRes, configRes, logsRes, analyticsRes, feedbacksRes] = await Promise.all([
          fetch("/api/admin/users", { headers }),
          fetch("/api/admin/config", { headers }),
          fetch("/api/admin/logs", { headers }),
          fetch("/api/analytics/data", { headers }),
          fetch("/api/admin/feedback", { headers })
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) setUsers(usersData);
        }
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData && !configData.error) setSystemConfig(configData);
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (Array.isArray(logsData)) setLiveLogs(logsData);
        }
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData && !analyticsData.error) setAnalytics(analyticsData);
        }
        if (feedbacksRes.ok) {
          const feedbacksData = await feedbacksRes.json();
          if (Array.isArray(feedbacksData)) setFeedbacks(feedbacksData);
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAdminData();

    // Auto-refresh logs and analytics every 10 seconds
    const interval = setInterval(async () => {
      const headers = {
        "x-admin-email": currentUser.email
      };
      try {
        const [logsRes, analyticsRes, feedbacksRes] = await Promise.all([
          fetch("/api/admin/logs", { headers }),
          fetch("/api/analytics/data", { headers }),
          fetch("/api/admin/feedback", { headers })
        ]);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (Array.isArray(logsData)) setLiveLogs(logsData);
        }
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData && !analyticsData.error) setAnalytics(analyticsData);
        }
        if (feedbacksRes.ok) {
          const feedbacksData = await feedbacksRes.json();
          if (Array.isArray(feedbacksData)) setFeedbacks(feedbacksData);
        }
      } catch (err) {
        console.error("Auto refresh error:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthorized, currentUser]);

  // Synchronize System Parameters on settings change
  const initialConfigLoaded = useRef(false);
  useEffect(() => {
    if (isAuthorized !== true || !currentUser) return;
    if (!initialConfigLoaded.current) {
      initialConfigLoaded.current = true;
      return;
    }

    const saveSystemConfig = async () => {
      try {
        await fetch("/api/admin/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-email": currentUser.email
          },
          body: JSON.stringify(systemConfig)
        });
      } catch (err) {
        console.error("Failed to save system config:", err);
      }
    };

    saveSystemConfig();
  }, [systemConfig, isAuthorized, currentUser]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-semibold tracking-wide">جاري التحقق من الصلاحيات... / Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans p-6" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/5">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">دخول غير مصرح به!</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              هذه الصفحة مخصصة لمدراء النظام الفائقين فقط (Super Admin). يرجى التأكد من تسجيل الدخول بحساب مخول للدخول إلى لوحة التحكم.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمترجم الرئيسي</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Statistics Calculations
  const usersArray = Array.isArray(users) ? users : [];
  const totalUsersCount = usersArray.length;
  const premiumUsersCount = usersArray.filter(u => u.plan !== "free").length;
  const totalQuotaUsed = usersArray.reduce((acc, u) => acc + u.quotaUsed, 0);
  const totalQuotaLimit = usersArray.reduce((acc, u) => acc + u.quotaLimit, 0);

  // Filter and Sort Users
  const filteredUsers = usersArray
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = planFilter === "all" || user.plan === planFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (typeof valA === "string") {
        return sortOrder === "asc" 
          ? (valA as string).localeCompare(valB as string) 
          : (valB as string).localeCompare(valA as string);
      } else {
        return sortOrder === "asc" 
          ? (valA as number) - (valB as number) 
          : (valB as number) - (valA as number);
      }
    });

  const handleUpdateUserStatus = async (userId: string, currentStatus: "active" | "suspended") => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": currentUser.email
        },
        body: JSON.stringify({ id: userId, status: nextStatus })
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update user status");
      }
    } catch (err) {
      console.error("Failed to update user status in DB:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmationText = isArabic 
      ? "هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
      : "Are you sure you want to permanently delete this user? This action cannot be undone.";
    if (!window.confirm(confirmationText)) return;

    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": currentUser.email
        },
        body: JSON.stringify({ id: userId })
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user in DB:", err);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": currentUser.email
        },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
        setEditingUser(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save user updates");
      }
    } catch (err) {
      console.error("Failed to save user edit:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": currentUser.email
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
        setIsCreatingUser(false);
        setNewUser({
          name: "",
          email: "",
          plan: "free",
          quotaLimit: 5000,
          preferredDomain: "general",
          role: "user",
          permissions: ["translate", "upload_files"]
        });
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Failed to create user:", err);
    }
  };

  const toggleSort = (field: "name" | "quotaUsed" | "joinedDate") => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const downloadDiagnostics = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ users, systemConfig, analytics, date: new Date().toISOString(), platform: "Tarjuman AI Web" }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tarjuman-diagnostics-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 font-sans flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              <span>{isArabic ? "لوحة تحكم المدير الفائق" : "Super Admin Console"}</span>
              <span className="text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                ROOT
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              {isArabic ? "مراقبة حركة الزيارات، تعديل الصلاحيات، وضبط معاملات محركات الترجمة" : "Monitor traffic diagnostics, role systems, quotas and configuration engines"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Live System Health Pulse */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400">{isArabic ? "متصل" : "Online"}</span>
            <span className="text-slate-600">|</span>
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="font-mono text-slate-300 tabular-nums">
              {liveClock.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          {/* Admin Identity Badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-[10px] font-black flex items-center justify-center uppercase">
                {currentUser.name?.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-white leading-none">{currentUser.name}</p>
                <p className="text-[8px] text-slate-500 font-mono">{currentUser.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsArabic(!isArabic)}
            className="text-[10px] font-bold px-2.5 py-1.5 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all cursor-pointer bg-slate-900 text-slate-300"
          >
            {isArabic ? "EN" : "AR"}
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArabic ? "الرجوع للمترجم" : "Exit Console"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-60 border-r border-slate-800 bg-slate-950 p-3 flex flex-col gap-1 flex-shrink-0 text-white border-l-0">
          <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-[0.15em] px-3 mb-2 mt-1 text-left">
            {isArabic ? "أدوات المدير الفائق" : "Super Admin Tools"}
          </p>
          
          {[
            { id: "overview" as const, icon: LayoutDashboard, labelAr: "نظرة عامة", labelEn: "Overview", badge: null },
            { id: "analytics" as const, icon: BarChart3, labelAr: "تحليلات الزيارات", labelEn: "Traffic Analytics", badge: analytics?.totalVisits || null },
            { id: "users" as const, icon: Users, labelAr: "الأعضاء والصلاحيات", labelEn: "Users & Roles", badge: totalUsersCount || null },
            { id: "settings" as const, icon: Sliders, labelAr: "إعدادات المحرك", labelEn: "Engine Settings", badge: null },
            { id: "logs" as const, icon: Activity, labelAr: "سجلات العمليات", labelEn: "Audit Logs", badge: liveLogs.length || null },
            { id: "feedbacks" as const, icon: MessageSquare, labelAr: "تقييمات العملاء", labelEn: "Feedbacks", badge: feedbacks.length || null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-900/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <tab.icon className="w-4 h-4" />
                <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
              </div>
              {tab.badge !== null && (
                <span className={`text-[9px] font-black min-w-[20px] text-center px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                }`}>
                  {tab.badge > 999 ? `${(tab.badge / 1000).toFixed(1)}k` : tab.badge}
                </span>
              )}
            </button>
          ))}

          {/* Diagnostics Download */}
          <div className="mt-auto pt-4 border-t border-slate-900 hidden md:block space-y-2">
            {/* Quick System Status */}
            <div className="px-3 py-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-2">
              <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">{isArabic ? "حالة المحرك" : "Engine Status"}</p>
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span className="text-slate-400 truncate">{systemConfig.translationEngine}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                {systemConfig.maintenanceMode 
                  ? <><WifiOff className="w-3 h-3 text-rose-400" /><span className="text-rose-400">{isArabic ? "وضع الصيانة" : "Maintenance"}</span></>
                  : <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">{isArabic ? "يعمل بكفاءة" : "Operational"}</span></>
                }
              </div>
            </div>
            <button
              onClick={downloadDiagnostics}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isArabic ? "تصدير تشخيصي" : "Export Diagnostics"}</span>
            </button>
          </div>
        </aside>

        {/* Workspace Body */}
        <main className="flex-1 bg-slate-900 p-4 sm:p-6 overflow-y-auto">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-semibold">{isArabic ? "جاري جلب إحصائيات الخادم..." : "Fetching administration records..."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Welcome Banner */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_60%)]"></div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                          {isArabic ? `مرحباً، ${currentUser?.name?.split(" ")[0]} 👋` : `Welcome back, ${currentUser?.name?.split(" ")[0]} 👋`}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {liveClock.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 text-center">
                          <p className="text-lg font-black text-white">{totalUsersCount}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">{isArabic ? "مستخدم" : "Users"}</p>
                        </div>
                        <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 text-center">
                          <p className="text-lg font-black text-emerald-400">{premiumUsersCount}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">{isArabic ? "مميز" : "Premium"}</p>
                        </div>
                        <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 text-center">
                          <p className="text-lg font-black text-indigo-400">{analytics?.totalVisits || 0}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">{isArabic ? "زيارة" : "Visits"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "إجمالي المسجلين" : "Registered Users"}</p>
                        <h3 className="text-2xl font-black text-white">{totalUsersCount}</h3>
                      </div>
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "الاشتراكات الممتازة" : "Premium Accounts"}</p>
                        <h3 className="text-2xl font-black text-emerald-400">{premiumUsersCount}</h3>
                      </div>
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <CreditCard className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "إجمالي الكلمات المترجمة" : "Total Translated Words"}</p>
                        <h3 className="text-2xl font-black text-white">{totalQuotaUsed.toLocaleString()}</h3>
                      </div>
                      <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                        <Coins className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "مجموع زيارات الموقع" : "Total Traffic Visits"}</p>
                        <h3 className="text-2xl font-black text-indigo-400">{analytics?.totalVisits || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "متوسط تقييم الخدمة" : "Average User Rating"}</p>
                        <h3 className="text-2xl font-black text-amber-400">
                          {feedbacks.length 
                            ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
                            : "0.0"} ★
                        </h3>
                      </div>
                      <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                        <Star className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Quota Utilization & User Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Global Quota Utilization */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400" />
                        <span>{isArabic ? "استهلاك الحصة الإجمالية للمنصة" : "Platform Global Quota Usage"}</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>{totalQuotaUsed.toLocaleString()} {isArabic ? "كلمة مستهلكة" : "words used"}</span>
                          <span>{totalQuotaLimit.toLocaleString()} {isArabic ? "الحد الأقصى" : "total limit"}</span>
                        </div>
                        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 transition-all duration-700"
                            style={{ width: `${Math.min(100, (totalQuotaUsed / (totalQuotaLimit || 1)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 text-center">
                          {((totalQuotaUsed / (totalQuotaLimit || 1)) * 100).toFixed(1)}% {isArabic ? "من الحد المتاح" : "of total capacity"}
                        </p>
                      </div>
                    </div>

                    {/* User Plan Distribution */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-violet-400" />
                        <span>{isArabic ? "توزيع الاشتراكات حسب الخطة" : "Subscriptions Breakdown"}</span>
                      </h4>
                      <div className="space-y-2.5">
                        {[
                          { plan: "enterprise", labelAr: "شركات", labelEn: "Enterprise", color: "bg-emerald-500", textColor: "text-emerald-400" },
                          { plan: "pro", labelAr: "احترافي", labelEn: "Pro", color: "bg-indigo-500", textColor: "text-indigo-400" },
                          { plan: "free", labelAr: "مجاني", labelEn: "Free", color: "bg-slate-600", textColor: "text-slate-400" },
                        ].map((p) => {
                          const count = usersArray.filter(u => u.plan === p.plan).length;
                          const pct = totalUsersCount ? (count / totalUsersCount) * 100 : 0;
                          return (
                            <div key={p.plan} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className={p.textColor}>{isArabic ? p.labelAr : p.labelEn}</span>
                                <span className="text-slate-400">{count} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${p.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick Audit & Config Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <span>{isArabic ? "آخر العمليات المسجلة في الاستوديو" : "Recent Activity Logs"}</span>
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {liveLogs.slice(0, 5).map((log, index) => (
                          <div key={index} className="flex gap-3 text-xs items-start bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-left">
                            <span className="text-[10px] text-slate-500 font-bold font-mono mt-0.5">{log.time}</span>
                            <div className="space-y-0.5 flex-1">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                                log.type === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                              }`}>
                                {log.action}
                              </span>
                              <p className="text-slate-300 mt-1.5 font-medium leading-relaxed">{log.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 text-left">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        <span>{isArabic ? "حالة محرك الترجمة الحالية" : "Active Engines Summary"}</span>
                      </h4>
                      <div className="space-y-4 text-xs font-semibold text-slate-300">
                        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl">
                          <span>{isArabic ? "نموذج الذكاء الاصطناعي:" : "Active AI Model:"}</span>
                          <span className="text-indigo-400 font-bold">{systemConfig.translationEngine}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl">
                          <span>{isArabic ? "الترجمة للمجهولين:" : "Anoymous Uploads:"}</span>
                          <span className={systemConfig.requireAuthForUpload ? "text-amber-400" : "text-emerald-400"}>
                            {systemConfig.requireAuthForUpload 
                              ? (isArabic ? "مغلق (يتطلب حساب)" : "Requires Authentication")
                              : (isArabic ? "مفتوح للجميع" : "Allowed")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl">
                          <span>{isArabic ? "وضع الصيانة:" : "Maintenance Status:"}</span>
                          <span className={systemConfig.maintenanceMode ? "text-rose-400" : "text-emerald-400"}>
                            {systemConfig.maintenanceMode ? (isArabic ? "نشط" : "Under Maintenance") : (isArabic ? "معطل (يعمل بكفاءة)" : "Online")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANALYTICS & VISITS */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* Traffic Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "مجموع زيارات الموقع" : "Total Visits"}</p>
                        <h3 className="text-2xl font-black text-white">{analytics?.totalVisits || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <Globe className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "الزوار الفريدون (IP)" : "Unique Visitors"}</p>
                        <h3 className="text-2xl font-black text-emerald-400">{analytics?.uniqueVisitors || 0}</h3>
                      </div>
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <UserCheck className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "ترجمات مكتملة" : "Completed Translations"}</p>
                        <h3 className="text-2xl font-black text-indigo-400">{analytics?.totalTranslations || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <Activity className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Graphs & Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                    
                    {/* Daily Trend Chart Placeholder */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-3">{isArabic ? "معدل الزيارات اليومي (آخر 7 أيام)" : "Daily Visits Trend"}</h4>
                      <div className="flex h-48 items-end gap-2 pt-4">
                        {analytics?.dailyTrend.map((t, idx) => {
                          const maxVisits = Math.max(...(analytics.dailyTrend.map(d => d.visits)), 1);
                          const pct = (t.visits / maxVisits) * 80 + 10; // min 10% height
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                              <span className="text-[10px] font-black text-indigo-400 font-mono">{t.visits}</span>
                              <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-lg hover:opacity-85 transition-opacity" style={{ height: `${pct}%` }} />
                              <span className="text-[8px] font-bold text-slate-500 tracking-wider truncate w-full text-center">
                                {t.date.substring(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visited Pages */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-3">{isArabic ? "الصفحات النشطة والأكثر زيارة" : "Most Active Pages"}</h4>
                      <div className="space-y-2">
                        {analytics?.pageViews.map((pv, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs font-semibold">
                            <span className="text-slate-300 font-mono">{pv.path}</span>
                            <span className="text-white bg-slate-800 px-3 py-1 rounded-lg">{pv.count} {isArabic ? "زيارة" : "views"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Referrers breakdown */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-3">{isArabic ? "مصادر الزيارات وتدفق المرور" : "Top Traffic Referrers"}</h4>
                      <div className="space-y-2">
                        {analytics?.referrers.map((ref, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs font-semibold">
                            <span className="text-slate-300 font-mono">{ref.referrer}</span>
                            <span className="text-white bg-slate-800 px-3 py-1 rounded-lg">{ref.count} {isArabic ? "إحالة" : "hits"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Browser types */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-3">{isArabic ? "تحليل متصفحات المستخدمين" : "User Browsers Breakdown"}</h4>
                      <div className="space-y-2">
                        {analytics?.browsers.map((b, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs font-semibold">
                            <span className="text-slate-300">{b.browser}</span>
                            <span className="text-indigo-400">{b.count} ({((b.count / (analytics.totalVisits || 1)) * 100).toFixed(1)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: USERS & PERMISSIONS */}
              {activeTab === "users" && (
                <div className="space-y-6">
                  {/* Users Database Header Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950 p-4 border border-slate-800 rounded-3xl">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder={isArabic ? "ابحث بالاسم أو البريد..." : "Search users..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-800 bg-slate-900 rounded-2xl text-white focus:outline-none focus:border-indigo-500 text-left"
                      />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pr-1">
                      <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="text-xs bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 cursor-pointer font-bold"
                      >
                        <option value="all">{isArabic ? "كل الاشتراكات" : "All Plans"}</option>
                        <option value="free">{isArabic ? "الخطة المجانية" : "Free Plan"}</option>
                        <option value="pro">{isArabic ? "الخطة الاحترافية" : "Pro Plan"}</option>
                        <option value="enterprise">{isArabic ? "خطة الشركات" : "Enterprise"}</option>
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 cursor-pointer font-bold"
                      >
                        <option value="all">{isArabic ? "كل الحالات" : "All Status"}</option>
                        <option value="active">{isArabic ? "نشط" : "Active"}</option>
                        <option value="suspended">{isArabic ? "موقوف" : "Suspended"}</option>
                      </select>

                      <button
                        onClick={() => setIsCreatingUser(true)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isArabic ? "عضو جديد" : "New User"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Users Database Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                            <th className="p-4 cursor-pointer" onClick={() => toggleSort("name")}>
                              <div className="flex items-center gap-1">
                                <span>{isArabic ? "الاسم / البريد" : "Identity"}</span>
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                            <th className="p-4">{isArabic ? "الرتبة والمسؤولية" : "Role"}</th>
                            <th className="p-4">{isArabic ? "الباقة الاشتراكية" : "Subscription"}</th>
                            <th className="p-4 cursor-pointer" onClick={() => toggleSort("quotaUsed")}>
                              <div className="flex items-center gap-1">
                                <span>{isArabic ? "الاستهلاك والحد" : "Usage (words)"}</span>
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                            <th className="p-4 cursor-pointer" onClick={() => toggleSort("joinedDate")}>
                              <div className="flex items-center gap-1">
                                <span>{isArabic ? "التسجيل / النشاط" : "Liveliness"}</span>
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                            <th className="p-4 text-center">{isArabic ? "خيارات التعديل" : "Actions"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-white text-sm">{user.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  user.role === "super_admin" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                  user.role === "admin" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                  user.role === "moderator" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                  user.role === "editor" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                  "bg-slate-800/50 border-slate-700 text-slate-400"
                                }`}>
                                  {user.role || "user"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  user.plan === "enterprise" ? "bg-emerald-500/10 text-emerald-400" :
                                  user.plan === "pro" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"
                                }`}>
                                  {user.plan}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <p className="font-bold font-mono">{user.quotaUsed.toLocaleString()} / {user.quotaLimit.toLocaleString()}</p>
                                  <div className="w-28 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${user.quotaUsed >= user.quotaLimit ? "bg-rose-500" : "bg-indigo-500"}`} 
                                      style={{ width: `${Math.min(100, (user.quotaUsed / user.quotaLimit) * 100)}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5 text-[10px] font-mono text-slate-400">
                                  <p>{isArabic ? `تاريخ الانضمام: ${user.joinedDate}` : `Joined: ${user.joinedDate}`}</p>
                                  <p>{isArabic ? `آخر نشاط: ${user.lastActive}` : `Active: ${user.lastActive}`}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                    title={isArabic ? "تعديل البيانات والصلاحيات" : "Edit user settings"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleUpdateUserStatus(user.id, user.status)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      user.status === "active" 
                                        ? "hover:bg-amber-500/10 text-slate-400 hover:text-amber-400" 
                                        : "hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400"
                                    }`}
                                    title={user.status === "active" ? (isArabic ? "توقيف الحساب" : "Suspend user") : (isArabic ? "تنشيط الحساب" : "Activate user")}
                                    disabled={user.role === "super_admin"}
                                  >
                                    {user.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                    title={isArabic ? "حذف الحساب نهائياً" : "Delete user profile"}
                                    disabled={user.role === "super_admin"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM SETTINGS */}
              {activeTab === "settings" && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-2xl mx-auto space-y-6 text-left">
                  <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                    {isArabic ? "تعديل إعدادات محرك الترجمة الذكية" : "System Control Parameters"}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">{isArabic ? "المحرك الافتراضي للترجمة والسياق:" : "Default Translation AI Model:"}</label>
                      <select
                        value={systemConfig.translationEngine}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, translationEngine: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold cursor-pointer"
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (متعدد الاستخدامات وسريع)</option>
                        <option value="gemini-3.5-pro">Gemini 3.5 Pro (عالي الذكاء والترجمة للمستندات المعقدة)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">{isArabic ? "الحد الافتراضي المجاني للاستخدام (كلمة):" : "Default Free Plan Words Quota Limit:"}</label>
                      <input
                        type="number"
                        value={systemConfig.defaultFreeLimit}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, defaultFreeLimit: parseInt(e.target.value, 10) }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white font-bold text-left"
                      />
                    </div>

                    <div className="pt-4 space-y-3">
                      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white">{isArabic ? "فرض تسجيل الدخول لترجمة الملفات" : "Require Authentication for File/PDF Translation"}</h5>
                          <p className="text-[10px] text-slate-400 leading-normal">{isArabic ? "يمنع المستخدمين المجهولين من رفع وترجمة ملفات الـ PDF لحفظ الحصة الحسابية للمحرك" : "Blocks guest translation requests to save billing quotas."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.requireAuthForUpload}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, requireAuthForUpload: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white">{isArabic ? "مستوى التبصر والتحليل اللغوي المتقدم" : "Enable Advanced Linguistic Analysis Options"}</h5>
                          <p className="text-[10px] text-slate-400 leading-normal">{isArabic ? "تفعيل أدوات الذكاء الاصطناعي لاستخراج المصطلحات، الكلمات الأكثر تكراراً والنبرة اللغوية" : "Enables extra translation insights like terminology mining."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.enableLinguisticAnalysis}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, enableLinguisticAnalysis: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white">{isArabic ? "تسجيل تفاصيل الترجمات في السجل" : "Log Translation Details in System Logs"}</h5>
                          <p className="text-[10px] text-slate-400 leading-normal">{isArabic ? "يسجل تفاصيل العمليات مثل عدد الكلمات وعنوان المستند لزيادة دقة تتبع العمليات" : "Logs data context for monitoring quotas."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.logTranslationRequests}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, logTranslationRequests: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-rose-950/10 p-4 rounded-2xl border border-rose-950/20">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-rose-400">{isArabic ? "تفعيل وضع صيانة النظام" : "Activate System Maintenance Mode"}</h5>
                          <p className="text-[10px] text-rose-500/80 leading-normal">{isArabic ? "يقوم بتعطيل المترجم للعامة وعرض واجهة الصيانة مع السماح لمدراء النظام فقط بالدخول" : "Restricts general users from translating text during updates."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.maintenanceMode}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                          className="w-4 h-4 text-rose-600 bg-slate-900 border-slate-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Financial Integrations Settings Card */}
                    <div className="border-t border-slate-800 pt-6 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 pb-1">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>{isArabic ? "بوابات الدفع والربط المالي النشطة" : "Active Financial Payment Gateways"}</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                        {/* PayPal Config Card */}
                        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-3.5">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>PayPal Gateway</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-wider">
                              {isArabic ? "نشط" : "Active"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{isArabic ? "معرف العميل (Client ID):" : "Client ID:"}</p>
                            <p className="font-mono text-[9px] text-slate-300 truncate bg-slate-950 p-2 rounded-lg border border-slate-800/60 text-left" dir="ltr">BAAtW0FbdA45N9wcAkCk...Vzcw</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{isArabic ? "الوضعية التشغيلية:" : "Gateway Mode:"}</p>
                            <p className="text-slate-300 text-[10px] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
                              <span>{isArabic ? "الوضع التجريبي (Sandbox)" : "Sandbox Mode"}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            </p>
                          </div>
                        </div>

                        {/* Paymob Config Card */}
                        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-3.5">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Paymob Gateway</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-wider">
                              {isArabic ? "نشط" : "Active"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 font-mono text-left" dir="ltr">
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60 space-y-1">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Card Integration</span>
                              <span>5738501</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60 space-y-1">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Tap-on-Phone</span>
                              <span>5738500</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{isArabic ? "معرف الإطار (Iframe ID):" : "Iframe ID:"}</p>
                            <p className="font-mono text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/60 text-left" dir="ltr">1002380</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SYSTEM LOGS */}
              {activeTab === "logs" && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span>{isArabic ? "سجل المعاملات والعمليات المباشر" : "System Transaction Logs (Live)"}</span>
                    </h4>
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5 uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isArabic ? "تحديث تلقائي (10 ثوانٍ)" : "Auto-Refresh: 10s"}</span>
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {liveLogs.map((log, index) => (
                      <div key={index} className="flex gap-3 text-xs items-start bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-left">
                        <span className="text-[10px] text-slate-500 font-bold font-mono mt-0.5">{log.time}</span>
                        <div className="space-y-0.5 flex-1">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                            log.type === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {log.action}
                          </span>
                          <p className="text-slate-300 mt-1.5 font-medium leading-relaxed">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CUSTOMER FEEDBACKS */}
              {activeTab === "feedbacks" && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>{isArabic ? "آراء وتقييمات العملاء المباشرة" : "Customer Ratings & Feedback Logs"}</span>
                    </h4>

                    {/* Stats summary */}
                    <div className="flex gap-4 text-xs font-semibold text-slate-400">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-2">
                        <span>{isArabic ? "متوسط التقييم:" : "Average Rating:"}</span>
                        <span className="text-amber-400 font-bold">
                          {feedbacks.length 
                            ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
                            : "0.0"} ★
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-2">
                        <span>{isArabic ? "إجمالي الآراء:" : "Total Submissions:"}</span>
                        <span className="text-white font-bold">{feedbacks.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution Histogram */}
                  {feedbacks.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "توزيع التقييمات" : "Rating Distribution"}</p>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = feedbacks.filter(f => f.rating === star).length;
                          const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-[10px]">
                              <span className="text-amber-400 font-bold w-4 text-center">{star}</span>
                              <span className="text-slate-600">★</span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-slate-500 font-bold w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feedbacks list */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {feedbacks.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        {isArabic ? "لا توجد تقييمات أو ملاحظات مسجلة بعد." : "No user feedbacks have been recorded yet."}
                      </div>
                    ) : (
                      feedbacks.map((f) => (
                        <div key={f.id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-left flex flex-col sm:flex-row gap-4 items-start justify-between">
                          <div className="space-y-2 flex-1">
                            {/* Stars & email */}
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span key={s} className={s <= f.rating ? "text-amber-400 text-sm" : "text-slate-700 text-sm"}>★</span>
                                ))}
                              </div>
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full font-mono">
                                {f.email || "anonymous"}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold font-mono">
                                {f.timestamp ? f.timestamp.replace("T", " ").substring(0, 19) : ""}
                              </span>
                            </div>

                            {/* Comment */}
                            <p className="text-slate-200 text-xs font-semibold leading-relaxed">
                              {f.comment || <span className="text-slate-600 italic">{isArabic ? "(لا توجد تعليقات مكتوبة)" : "(No written comment)"}</span>}
                            </p>

                            {/* Details context */}
                            {f.details && (
                              <p className="text-[10px] text-slate-500 font-bold font-mono">
                                {f.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: EDIT USER DIALOG */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir={isArabic ? "rtl" : "ltr"}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-white">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>{isArabic ? "تعديل صلاحيات العضو:" : "Edit Profile Settings"}</span>
              </h4>
              <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUserEdit} className="p-5 space-y-4 text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "اسم العضو:" : "Full Name"}</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "البريد الإلكتروني:" : "Email Address"}</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الرتبة في النظام:" : "System Role"}</label>
                  <select
                    value={editingUser.role || "user"}
                    onChange={(e) => {
                      const selectedRole = e.target.value as any;
                      setEditingUser(prev => prev ? ({ 
                        ...prev, 
                        role: selectedRole,
                        permissions: JSON.stringify(getDefaultPermissionsForRole(selectedRole))
                      }) : null);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold cursor-pointer"
                    disabled={editingUser.email === "romyatef@gmail.com"}
                  >
                    <option value="super_admin">super_admin (مدير عام فائق)</option>
                    <option value="admin">admin (مدير نظام)</option>
                    <option value="moderator">moderator (مراقب عام)</option>
                    <option value="editor">editor (محرر لغوي)</option>
                    <option value="user">user (مستخدم عادي)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الحصة المتاحة (كلمة):" : "Words Quota Limit"}</label>
                  <input
                    type="number"
                    value={editingUser.quotaLimit}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, quotaLimit: parseInt(e.target.value, 10) }) : null)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الخطة الاشتراكية:" : "Billing Plan"}</label>
                  <select
                    value={editingUser.plan}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, plan: e.target.value }) : null)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold cursor-pointer"
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "حالة الحساب:" : "Account Status"}</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold cursor-pointer"
                    disabled={editingUser.role === "super_admin"}
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </div>
              </div>

              {/* Permissions checkboxes */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الصلاحيات الممنوحة للمستخدم:" : "Assigned Permissions"}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const currentPermissions: string[] = JSON.parse(editingUser.permissions || "[]");
                    const hasPerm = currentPermissions.includes(perm.code);
                    return (
                      <label key={perm.code} className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                        <input
                          type="checkbox"
                          checked={hasPerm}
                          onChange={(e) => {
                            let updated: string[];
                            if (e.target.checked) {
                              updated = [...currentPermissions, perm.code];
                            } else {
                              updated = currentPermissions.filter(p => p !== perm.code);
                            }
                            setEditingUser(prev => prev ? ({ ...prev, permissions: JSON.stringify(updated) }) : null);
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-800 cursor-pointer"
                          disabled={editingUser.email === "romyatef@gmail.com"}
                        />
                        <span className="text-[10px] font-bold text-slate-300">{isArabic ? perm.nameAr : perm.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  {isArabic ? "حفظ التغييرات" : "Save Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE USER DIALOG */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir={isArabic ? "rtl" : "ltr"}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-white">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>{isArabic ? "إضافة عضو جديد للنظام:" : "Register New Account"}</span>
              </h4>
              <button onClick={() => setIsCreatingUser(false)} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الاسم الكامل:" : "Full Name"}</label>
                  <input
                    type="text"
                    placeholder="Ramy"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "البريد الإلكتروني:" : "Email Address"}</label>
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الرتبة في النظام:" : "System Role"}</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const selectedRole = e.target.value;
                      setNewUser(prev => ({ 
                        ...prev, 
                        role: selectedRole,
                        permissions: getDefaultPermissionsForRole(selectedRole)
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold cursor-pointer"
                  >
                    <option value="super_admin">super_admin (مدير عام فائق)</option>
                    <option value="admin">admin (مدير نظام)</option>
                    <option value="moderator">moderator (مراقب عام)</option>
                    <option value="editor">editor (محرر لغوي)</option>
                    <option value="user">user (مستخدم عادي)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الحد الأقصى للاستخدام (كلمة):" : "Words Quota Limit"}</label>
                  <input
                    type="number"
                    value={newUser.quotaLimit}
                    onChange={(e) => setNewUser(prev => ({ ...prev, quotaLimit: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الباقة الاشتراكية:" : "Billing Plan"}</label>
                  <select
                    value={newUser.plan}
                    onChange={(e) => setNewUser(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold cursor-pointer"
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "المجال المفضل:" : "Preferred Domain"}</label>
                  <select
                    value={newUser.preferredDomain}
                    onChange={(e) => setNewUser(prev => ({ ...prev, preferredDomain: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold cursor-pointer"
                  >
                    <option value="general">general</option>
                    <option value="legal">legal</option>
                    <option value="medical">medical</option>
                    <option value="financial">financial</option>
                    <option value="technical">technical</option>
                  </select>
                </div>
              </div>

              {/* Permissions checkboxes */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الصلاحيات الممنوحة للعضو:" : "Assigned Permissions"}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const hasPerm = newUser.permissions.includes(perm.code);
                    return (
                      <label key={perm.code} className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                        <input
                          type="checkbox"
                          checked={hasPerm}
                          onChange={(e) => {
                            let updated: string[];
                            if (e.target.checked) {
                              updated = [...newUser.permissions, perm.code];
                            } else {
                              updated = newUser.permissions.filter(p => p !== perm.code);
                            }
                            setNewUser(prev => ({ ...prev, permissions: updated }));
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-slate-300">{isArabic ? perm.nameAr : perm.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  {isArabic ? "تسجيل العضو" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
