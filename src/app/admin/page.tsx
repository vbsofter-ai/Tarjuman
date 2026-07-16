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
  Target,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Hash,
  RotateCcw,
  History as HistoryIcon,
  Wand2,
  BookOpen
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

  // SEO / AEO dashboard state
  const [seoCurrent, setSeoCurrent] = useState<any | null>(null);
  const [seoHistory, setSeoHistory] = useState<any[]>([]);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoUpdating, setSeoUpdating] = useState(false);
  const [seoMessage, setSeoMessage] = useState<string | null>(null);
  const [seoTab, setSeoTab] = useState<"current" | "keywords" | "faq" | "aeo" | "history">("current");

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "settings" | "logs" | "feedbacks" | "seo">("overview");

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

  // -------- SEO / AEO dashboard data fetcher --------
  const fetchSeoData = async () => {
    if (!currentUser) return;
    setSeoLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`/api/admin/seo?adminEmail=${encodeURIComponent(currentUser.email)}`),
        fetch(`/api/admin/seo?adminEmail=${encodeURIComponent(currentUser.email)}&history=1`),
      ]);
      if (currentRes.ok) {
        const data = await currentRes.json();
        setSeoCurrent(data);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        if (Array.isArray(data?.history)) setSeoHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load SEO data:", err);
      setSeoMessage(isArabic ? "فشل تحميل بيانات السيو" : "Failed to load SEO data");
    } finally {
      setSeoLoading(false);
    }
  };

  const handleSeoForceUpdate = async () => {
    if (!currentUser) return;
    setSeoUpdating(true);
    setSeoMessage(null);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: currentUser.email, force: true }),
      });
      const data = await res.json();
      if (res.ok && data?.ran) {
        setSeoMessage(
          isArabic
            ? `تم التحديث بنجاح (${data.snapshot?.faqCount || 0} أسئلة، ${data.snapshot?.capabilityCount || 0} إمكانيات، ~${data.snapshot?.tokensEstimated || 0} رمز)`
            : `Update complete (${data.snapshot?.faqCount || 0} FAQ, ${data.snapshot?.capabilityCount || 0} capabilities, ~${data.snapshot?.tokensEstimated || 0} tokens)`
        );
        await fetchSeoData();
      } else {
        setSeoMessage(data?.reason || (isArabic ? "فشل التحديث" : "Update failed"));
      }
    } catch (err) {
      setSeoMessage(String(err));
    } finally {
      setSeoUpdating(false);
    }
  };

  const handleSeoRollback = async (generatedAt: string) => {
    if (!currentUser) return;
    if (!confirm(isArabic ? `هل تريد استعادة هذه النسخة من ${generatedAt}?` : `Restore snapshot from ${generatedAt}?`)) return;
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: currentUser.email, rollback: generatedAt }),
      });
      if (res.ok) {
        setSeoMessage(isArabic ? "تمت الاستعادة بنجاح" : "Snapshot restored");
        await fetchSeoData();
      } else {
        setSeoMessage(isArabic ? "فشلت الاستعادة" : "Restore failed");
      }
    } catch (err) {
      setSeoMessage(String(err));
    }
  };

  useEffect(() => {
    if (activeTab === "seo" && isAuthorized === true && currentUser) {
      fetchSeoData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthorized, currentUser]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between text-slate-900 shadow-sm z-10">
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
            <p className="text-[10px] text-slate-400 font-medium">
              {isArabic ? "مراقبة حركة الزيارات، تعديل الصلاحيات، وضبط معاملات محركات الترجمة" : "Monitor traffic diagnostics, role systems, quotas and configuration engines"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Live System Health Pulse */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500">{isArabic ? "متصل" : "Online"}</span>
            <span className="text-slate-400">|</span>
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-slate-600 tabular-nums">
              {liveClock.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          {/* Admin Identity Badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-[10px] font-black flex items-center justify-center uppercase">
                {currentUser.name?.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-800 leading-none">{currentUser.name}</p>
                <p className="text-[8px] text-slate-400 font-mono">{currentUser.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsArabic(!isArabic)}
            className="text-[10px] font-bold px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer bg-white text-slate-600"
          >
            {isArabic ? "EN" : "AR"}
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArabic ? "الرجوع للمترجم" : "Exit Console"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-60 border-r border-slate-200 bg-white p-3 flex flex-col gap-1 flex-shrink-0 text-slate-800 border-l-0">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.15em] px-3 mb-2 mt-1 text-left">
            {isArabic ? "أدوات المدير الفائق" : "Super Admin Tools"}
          </p>
          
          {[
            { id: "overview" as const, icon: LayoutDashboard, labelAr: "نظرة عامة", labelEn: "Overview", badge: null },
            { id: "analytics" as const, icon: BarChart3, labelAr: "تحليلات الزيارات", labelEn: "Traffic Analytics", badge: analytics?.totalVisits || null },
            { id: "users" as const, icon: Users, labelAr: "الأعضاء والصلاحيات", labelEn: "Users & Roles", badge: totalUsersCount || null },
            { id: "settings" as const, icon: Sliders, labelAr: "إعدادات المحرك", labelEn: "Engine Settings", badge: null },
            { id: "seo" as const, icon: Wand2, labelAr: "SEO و AEO", labelEn: "SEO & AEO", badge: null },
            { id: "logs" as const, icon: Activity, labelAr: "سجلات العمليات", labelEn: "Audit Logs", badge: liveLogs.length || null },
            { id: "feedbacks" as const, icon: MessageSquare, labelAr: "تقييمات العملاء", labelEn: "Feedbacks", badge: feedbacks.length || null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700"
                }`}>
                  {tab.badge > 999 ? `${(tab.badge / 1000).toFixed(1)}k` : tab.badge}
                </span>
              )}
            </button>
          ))}

          {/* Diagnostics Download */}
          <div className="mt-auto pt-4 border-t border-slate-100 hidden md:block space-y-2">
            {/* Quick System Status */}
            <div className="px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "حالة المحرك" : "Engine Status"}</p>
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-600 truncate">{systemConfig.translationEngine}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                {systemConfig.maintenanceMode 
                  ? <><WifiOff className="w-3.5 h-3.5 text-rose-500" /><span className="text-rose-500">{isArabic ? "وضع الصيانة" : "Maintenance"}</span></>
                  : <><Wifi className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">{isArabic ? "يعمل بكفاءة" : "Operational"}</span></>
                }
              </div>
            </div>
            <button
              onClick={downloadDiagnostics}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-250 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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
                  <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50/80 via-violet-50/80 to-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_60%)]"></div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          {isArabic ? `مرحباً، ${currentUser?.name?.split(" ")[0]} 👋` : `Welcome back, ${currentUser?.name?.split(" ")[0]} 👋`}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {liveClock.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-center">
                          <p className="text-lg font-black text-slate-800">{totalUsersCount}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{isArabic ? "مستخدم" : "Users"}</p>
                        </div>
                        <div className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-center">
                          <p className="text-lg font-black text-emerald-600">{premiumUsersCount}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{isArabic ? "مميز" : "Premium"}</p>
                        </div>
                        <div className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-center">
                          <p className="text-lg font-black text-indigo-650">{analytics?.totalVisits || 0}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{isArabic ? "زيارة" : "Visits"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "إجمالي المسجلين" : "Registered Users"}</p>
                        <h3 className="text-2xl font-black text-slate-800">{totalUsersCount}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "الاشتراكات الممتازة" : "Premium Accounts"}</p>
                        <h3 className="text-2xl font-black text-emerald-600">{premiumUsersCount}</h3>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-650 rounded-2xl">
                        <CreditCard className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "إجمالي الكلمات المترجمة" : "Total Translated Words"}</p>
                        <h3 className="text-2xl font-black text-slate-800">{totalQuotaUsed.toLocaleString()}</h3>
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                        <Coins className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "مجموع زيارات الموقع" : "Total Traffic Visits"}</p>
                        <h3 className="text-2xl font-black text-indigo-600">{analytics?.totalVisits || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "متوسط تقييم الخدمة" : "Average User Rating"}</p>
                        <h3 className="text-2xl font-black text-amber-500">
                          {feedbacks.length 
                            ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
                            : "0.0"} ★
                        </h3>
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                        <Star className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Quota Utilization & User Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Global Quota Utilization */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-500" />
                        <span>{isArabic ? "استهلاك الحصة الإجمالية للمنصة" : "Platform Global Quota Usage"}</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{totalQuotaUsed.toLocaleString()} {isArabic ? "كلمة مستهلكة" : "words used"}</span>
                          <span>{totalQuotaLimit.toLocaleString()} {isArabic ? "الحد الأقصى" : "total limit"}</span>
                        </div>
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 transition-all duration-700"
                            style={{ width: `${Math.min(100, (totalQuotaUsed / (totalQuotaLimit || 1)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 text-center">
                          {((totalQuotaUsed / (totalQuotaLimit || 1)) * 100).toFixed(1)}% {isArabic ? "من الحد المتاح" : "of total capacity"}
                        </p>
                      </div>
                    </div>

                    {/* User Plan Distribution */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-violet-500" />
                        <span>{isArabic ? "توزيع الاشتراكات حسب الخطة" : "Subscriptions Breakdown"}</span>
                      </h4>
                      <div className="space-y-2.5">
                        {[
                          { plan: "enterprise", labelAr: "شركات", labelEn: "Enterprise", color: "bg-emerald-500", textColor: "text-emerald-600" },
                          { plan: "pro", labelAr: "احترافي", labelEn: "Pro", color: "bg-indigo-500", textColor: "text-indigo-600" },
                          { plan: "free", labelAr: "مجاني", labelEn: "Free", color: "bg-slate-400", textColor: "text-slate-500" },
                        ].map((p) => {
                          const count = usersArray.filter(u => u.plan === p.plan).length;
                          const pct = totalUsersCount ? (count / totalUsersCount) * 100 : 0;
                          return (
                            <div key={p.plan} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className={p.textColor}>{isArabic ? p.labelAr : p.labelEn}</span>
                                <span className="text-slate-400">{count} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Activity className="w-4 h-4 text-slate-500" />
                        <span>{isArabic ? "آخر العمليات المسجلة في الاستوديو" : "Recent Activity Logs"}</span>
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {liveLogs.slice(0, 5).map((log, index) => (
                          <div key={index} className="flex gap-3 text-xs items-start bg-slate-50/70 p-3 rounded-2xl border border-slate-100 text-left">
                            <span className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{log.time}</span>
                            <div className="space-y-0.5 flex-1">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                log.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                log.type === "warning" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}>
                                {log.action}
                              </span>
                              <p className="text-slate-600 mt-1.5 font-medium leading-relaxed">{log.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col gap-4 text-left shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Cpu className="w-4 h-4 text-indigo-500" />
                        <span>{isArabic ? "حالة محرك الترجمة الحالية" : "Active Engines Summary"}</span>
                      </h4>
                      <div className="space-y-4 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span>{isArabic ? "نموذج الذكاء الاصطناعي:" : "Active AI Model:"}</span>
                          <span className="text-indigo-650 font-bold">{systemConfig.translationEngine}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span>{isArabic ? "الترجمة للمجهولين:" : "Anoymous Uploads:"}</span>
                          <span className={systemConfig.requireAuthForUpload ? "text-amber-600" : "text-emerald-600"}>
                            {systemConfig.requireAuthForUpload 
                              ? (isArabic ? "مغلق (يتطلب حساب)" : "Requires Auth")
                              : (isArabic ? "مفتوح للجميع" : "Allowed")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span>{isArabic ? "وضع الصيانة:" : "Maintenance Status:"}</span>
                          <span className={systemConfig.maintenanceMode ? "text-rose-600" : "text-emerald-600"}>
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
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "مجموع زيارات الموقع" : "Total Visits"}</p>
                        <h3 className="text-2xl font-black text-slate-800">{analytics?.totalVisits || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Globe className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "الزوار الفريدون (IP)" : "Unique Visitors"}</p>
                        <h3 className="text-2xl font-black text-emerald-600">{analytics?.uniqueVisitors || 0}</h3>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-650 rounded-2xl">
                        <UserCheck className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isArabic ? "ترجمات مكتملة" : "Completed Translations"}</p>
                        <h3 className="text-2xl font-black text-indigo-650">{analytics?.totalTranslations || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Activity className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Graphs & Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                    
                    {/* Daily Trend Chart Placeholder */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">{isArabic ? "معدل الزيارات اليومي (آخر 7 أيام)" : "Daily Visits Trend"}</h4>
                      <div className="flex h-48 items-end gap-2 pt-4">
                        {analytics?.dailyTrend.map((t, idx) => {
                          const maxVisits = Math.max(...(analytics.dailyTrend.map(d => d.visits)), 1);
                          const pct = (t.visits / maxVisits) * 80 + 10; // min 10% height
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                              <span className="text-[10px] font-black text-indigo-600 font-mono">{t.visits}</span>
                              <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-lg hover:opacity-85 transition-opacity" style={{ height: `${pct}%` }} />
                              <span className="text-[8px] font-bold text-slate-400 tracking-wider truncate w-full text-center">
                                {t.date.substring(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visited Pages */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">{isArabic ? "الصفحات النشطة والأكثر زيارة" : "Most Active Pages"}</h4>
                      <div className="space-y-2">
                        {analytics?.pageViews.map((pv, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-semibold">
                            <span className="text-slate-650 font-mono">{pv.path}</span>
                            <span className="text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{pv.count} {isArabic ? "زيارة" : "views"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Referrers breakdown */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">{isArabic ? "مصادر الزيارات وتدفق المرور" : "Top Traffic Referrers"}</h4>
                      <div className="space-y-2">
                        {analytics?.referrers.map((ref, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-semibold">
                            <span className="text-slate-650 font-mono">{ref.referrer}</span>
                            <span className="text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{ref.count} {isArabic ? "إحالة" : "hits"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Browser types */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">{isArabic ? "تحليل متصفحات المستخدمين" : "User Browsers Breakdown"}</h4>
                      <div className="space-y-2">
                        {analytics?.browsers.map((b, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-semibold">
                            <span className="text-slate-600">{b.browser}</span>
                            <span className="text-indigo-600">{b.count} ({((b.count / (analytics.totalVisits || 1)) * 100).toFixed(1)}%)</span>
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
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 border border-slate-200 rounded-3xl shadow-sm">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder={isArabic ? "ابحث بالاسم أو البريد..." : "Search users..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-slate-50 rounded-2xl text-slate-800 focus:outline-none focus:border-indigo-500 text-left focus:bg-white"
                      />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pr-1">
                      <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-250 text-slate-700 rounded-xl px-3 py-2 cursor-pointer font-bold"
                      >
                        <option value="all">{isArabic ? "كل الاشتراكات" : "All Plans"}</option>
                        <option value="free">{isArabic ? "الخطة المجانية" : "Free Plan"}</option>
                        <option value="pro">{isArabic ? "الخطة الاحترافية" : "Pro Plan"}</option>
                        <option value="enterprise">{isArabic ? "خطة الشركات" : "Enterprise"}</option>
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-250 text-slate-700 rounded-xl px-3 py-2 cursor-pointer font-bold"
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
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
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
                        <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  user.role === "super_admin" ? "bg-rose-50 border-rose-200/60 text-rose-600" :
                                  user.role === "admin" ? "bg-amber-50 border-amber-200/60 text-amber-650" :
                                  user.role === "moderator" ? "bg-emerald-50 border-emerald-200/60 text-emerald-650" :
                                  user.role === "editor" ? "bg-blue-50 border-blue-200/60 text-blue-650" :
                                  "bg-slate-100 border-slate-200 text-slate-655"
                                }`}>
                                  {user.role || "user"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  user.plan === "enterprise" ? "bg-emerald-50 border-emerald-200/60 text-emerald-655" :
                                  user.plan === "pro" ? "bg-indigo-50 border-indigo-200/60 text-indigo-655" : "bg-slate-100 border-slate-200 text-slate-550"
                                }`}>
                                  {user.plan}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <p className="font-bold font-mono text-slate-700">{user.quotaUsed.toLocaleString()} / {user.quotaLimit.toLocaleString()}</p>
                                  <div className="w-28 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${user.quotaUsed >= user.quotaLimit ? "bg-rose-500" : "bg-indigo-500"}`} 
                                      style={{ width: `${Math.min(100, (user.quotaUsed / user.quotaLimit) * 100)}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5 text-[10px] font-mono text-slate-505">
                                  <p>{isArabic ? `تاريخ الانضمام: ${user.joinedDate}` : `Joined: ${user.joinedDate}`}</p>
                                  <p>{isArabic ? `آخر نشاط: ${user.lastActive}` : `Active: ${user.lastActive}`}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title={isArabic ? "تعديل البيانات والصلاحيات" : "Edit user settings"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleUpdateUserStatus(user.id, user.status)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      user.status === "active" 
                                        ? "hover:bg-amber-50 text-slate-500 hover:text-amber-600" 
                                        : "hover:bg-emerald-50 text-slate-500 hover:text-emerald-600"
                                    }`}
                                    title={user.status === "active" ? (isArabic ? "توقيف الحساب" : "Suspend user") : (isArabic ? "تنشيط الحساب" : "Activate user")}
                                    disabled={user.role === "super_admin"}
                                  >
                                    {user.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
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
                <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl mx-auto space-y-6 text-left shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                    {isArabic ? "تعديل إعدادات محرك الترجمة الذكية" : "System Control Parameters"}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-550">{isArabic ? "المحرك الافتراضي للترجمة والسياق:" : "Default Translation AI Model:"}</label>
                      <select
                        value={systemConfig.translationEngine}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, translationEngine: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (متعدد الاستخدامات وسريع)</option>
                        <option value="gemini-3.5-pro">Gemini 3.5 Pro (عالي الذكاء والترجمة للمستندات المعقدة)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-550">{isArabic ? "الحد الافتراضي المجاني للاستخدام (كلمة):" : "Default Free Plan Words Quota Limit:"}</label>
                      <input
                        type="number"
                        value={systemConfig.defaultFreeLimit}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, defaultFreeLimit: parseInt(e.target.value, 10) }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-left focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="pt-4 space-y-3">
                      <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-800">{isArabic ? "فرض تسجيل الدخول لترجمة الملفات" : "Require Authentication for File/PDF Translation"}</h5>
                          <p className="text-[10px] text-slate-500 leading-normal">{isArabic ? "يمنع المستخدمين المجهولين من رفع وترجمة ملفات الـ PDF لحفظ الحصة الحسابية للمحرك" : "Blocks guest translation requests to save billing quotas."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.requireAuthForUpload}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, requireAuthForUpload: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-800">{isArabic ? "مستوى التبصر والتحليل اللغوي المتقدم" : "Enable Advanced Linguistic Analysis Options"}</h5>
                          <p className="text-[10px] text-slate-500 leading-normal">{isArabic ? "تفعيل أدوات الذكاء الاصطناعي لاستخراج المصطلحات، الكلمات الأكثر تكراراً والنبرة اللغوية" : "Enables extra translation insights like terminology mining."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.enableLinguisticAnalysis}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, enableLinguisticAnalysis: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-800">{isArabic ? "تسجيل تفاصيل الترجمات في السجل" : "Log Translation Details in System Logs"}</h5>
                          <p className="text-[10px] text-slate-500 leading-normal">{isArabic ? "يسجل تفاصيل العمليات مثل عدد الكلمات وعنوان المستند لزيادة دقة تتبع العمليات" : "Logs data context for monitoring quotas."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.logTranslationRequests}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, logTranslationRequests: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-rose-600">{isArabic ? "تفعيل وضع صيانة النظام" : "Activate System Maintenance Mode"}</h5>
                          <p className="text-[10px] text-rose-600/90 leading-normal">{isArabic ? "يقوم بتعطيل المترجم للعامة وعرض واجهة الصيانة مع السماح لمدراء النظام فقط بالدخول" : "Restricts general users from translating text during updates."}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={systemConfig.maintenanceMode}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                          className="w-4 h-4 text-rose-600 bg-white border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Financial Integrations Settings Card */}
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-1">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>{isArabic ? "بوابات الدفع والربط المالي النشطة" : "Active Financial Payment Gateways"}</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                        {/* PayPal Config Card */}
                        <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-2xl space-y-3.5">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-slate-850 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>PayPal Gateway</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] bg-emerald-50 border border-emerald-250 text-emerald-650 font-black uppercase tracking-wider">
                              {isArabic ? "نشط" : "Active"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{isArabic ? "معرف العميل (Client ID):" : "Client ID:"}</p>
                            <p className="font-mono text-[9px] text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-200 text-left" dir="ltr">BAAtW0FbdA45N9wcAkCk...Vzcw</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{isArabic ? "الوضعية التشغيلية:" : "Gateway Mode:"}</p>
                            <p className="text-slate-650 text-[10px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                              <span>{isArabic ? "الوضع التجريبي (Sandbox)" : "Sandbox Mode"}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            </p>
                          </div>
                        </div>

                        {/* Paymob Config Card */}
                        <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-2xl space-y-3.5">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-slate-850 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Paymob Gateway</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] bg-emerald-50 border border-emerald-250 text-emerald-650 font-black uppercase tracking-wider">
                              {isArabic ? "نشط" : "Active"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-mono text-left" dir="ltr">
                            <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold block">Card Integration</span>
                              <span>5738501</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold block">Tap-on-Phone</span>
                              <span>5738500</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{isArabic ? "معرف الإطار (Iframe ID):" : "Iframe ID:"}</p>
                            <p className="font-mono text-[10px] text-slate-650 bg-white p-2 rounded-lg border border-slate-200 text-left" dir="ltr">1002380</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SYSTEM LOGS */}
              {activeTab === "logs" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span>{isArabic ? "سجل المعاملات والعمليات المباشر" : "System Transaction Logs (Live)"}</span>
                    </h4>
                    <span className="text-[10px] font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 uppercase bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isArabic ? "تحديث تلقائي (10 ثوانٍ)" : "Auto-Refresh: 10s"}</span>
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {liveLogs.map((log, index) => (
                      <div key={index} className="flex gap-3 text-xs items-start bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-left">
                        <span className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{log.time}</span>
                        <div className="space-y-0.5 flex-1">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            log.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            log.type === "warning" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {log.action}
                          </span>
                          <p className="text-slate-655 mt-1.5 font-medium leading-relaxed">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CUSTOMER FEEDBACKS */}
              {activeTab === "feedbacks" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-6 shadow-sm">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                    <h4 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>{isArabic ? "آراء وتقييمات العملاء المباشرة" : "Customer Ratings & Feedback Logs"}</span>
                    </h4>

                    {/* Stats summary */}
                    <div className="flex gap-4 text-xs font-semibold text-slate-500">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2">
                        <span>{isArabic ? "متوسط التقييم:" : "Average Rating:"}</span>
                        <span className="text-amber-600 font-bold">
                          {feedbacks.length 
                            ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
                            : "0.0"} ★
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2">
                        <span>{isArabic ? "إجمالي الآراء:" : "Total Submissions:"}</span>
                        <span className="text-slate-800 font-bold">{feedbacks.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution Histogram */}
                  {feedbacks.length > 0 && (
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "توزيع التقييمات" : "Rating Distribution"}</p>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = feedbacks.filter(f => f.rating === star).length;
                          const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-[10px]">
                              <span className="text-amber-500 font-bold w-4 text-center">{star}</span>
                              <span className="text-slate-350">★</span>
                              <div className="flex-1 h-2 bg-slate-150 rounded-full overflow-hidden">
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
                      <div className="text-center py-10 text-slate-400 text-xs">
                        {isArabic ? "لا توجد تقييمات أو ملاحظات مسجلة بعد." : "No user feedbacks have been recorded yet."}
                      </div>
                    ) : (
                      feedbacks.map((f) => (
                        <div key={f.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-150 text-left flex flex-col sm:flex-row gap-4 items-start justify-between">
                          <div className="space-y-2 flex-1">
                            {/* Stars & email */}
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span key={s} className={s <= f.rating ? "text-amber-500 text-sm" : "text-slate-200 text-sm"}>★</span>
                                ))}
                              </div>
                              <span className="text-[10px] font-extrabold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                                {f.email || "anonymous"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">
                                {f.timestamp ? f.timestamp.replace("T", " ").substring(0, 19) : ""}
                              </span>
                            </div>

                            {/* Comment */}
                            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                              {f.comment || <span className="text-slate-400 italic">{isArabic ? "(لا توجد تعليقات مكتوبة)" : "(No written comment)"}</span>}
                            </p>

                            {/* Details context */}
                            {f.details && (
                              <p className="text-[10px] text-slate-400 font-bold font-mono">
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

              {/* TAB 7: SEO & AEO */}
              {activeTab === "seo" && (
                <div className="space-y-5">
                  {/* Header card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Wand2 className="w-4 h-4 text-indigo-500" />
                          <span>{isArabic ? "إدارة السيو و AEO التلقائية" : "Automatic SEO & AEO Engine"}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {isArabic
                            ? "يقوم النظام بتوليد الكلمات المفتاحية، الأسئلة الشائعة، والوصف للذكاء الاصطناعي (AEO) كل 24 ساعة تلقائياً. يمكنك فرض تحديث فوري أو استعادة نسخة سابقة."
                            : "The system regenerates keywords, FAQ, and AI-crawler description (AEO) every 24h automatically. Force a refresh or roll back to any previous snapshot."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={fetchSeoData}
                          disabled={seoLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${seoLoading ? "animate-spin" : ""}`} />
                          <span>{isArabic ? "تحديث البيانات" : "Refresh"}</span>
                        </button>
                        <button
                          onClick={handleSeoForceUpdate}
                          disabled={seoUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20"
                        >
                          <Zap className={`w-3.5 h-3.5 ${seoUpdating ? "animate-pulse" : ""}`} />
                          <span>{seoUpdating ? (isArabic ? "جاري التوليد..." : "Generating...") : (isArabic ? "تحديث فوري" : "Force Update")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Status bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "آخر تحديث" : "Last Update"}</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {seoCurrent?.last_seo_update
                            ? new Date(seoCurrent.last_seo_update).toLocaleString(isArabic ? "ar-EG" : "en-US", { dateStyle: "short", timeStyle: "short" })
                            : (isArabic ? "لم يبدأ بعد" : "Not yet")}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "الموديل" : "Model"}</p>
                        <p className="mt-1 text-sm font-bold text-slate-800 font-mono">
                          {seoCurrent?.last_seo_model || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "التكلفة" : "Cost"}</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          ~{seoCurrent?.last_seo_tokens_estimated || 0} {isArabic ? "رمز" : "tokens"}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isArabic ? "المحتوى" : "Content"}</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {seoCurrent?.current?.seo_faq_count || 0} FAQ · {seoCurrent?.current?.aeo_capability_count || 0} {isArabic ? "إمكانية" : "caps"}
                        </p>
                      </div>
                    </div>

                    {seoMessage && (
                      <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-semibold">
                        {seoMessage}
                      </div>
                    )}
                  </div>

                  {/* Sub-tabs */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-1 border-b border-slate-100 mb-4 overflow-x-auto">
                      {[
                        { id: "current" as const, labelAr: "الحالي", labelEn: "Current", icon: Sparkles },
                        { id: "keywords" as const, labelAr: "الكلمات المفتاحية", labelEn: "Keywords", icon: Hash },
                        { id: "faq" as const, labelAr: "الأسئلة الشائعة", labelEn: "FAQ", icon: BookOpen },
                        { id: "aeo" as const, labelAr: "AEO", labelEn: "AEO", icon: Wand2 },
                        { id: "history" as const, labelAr: "السجل", labelEn: "History", icon: HistoryIcon },
                      ].map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSeoTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                              seoTab === t.id
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {isArabic ? t.labelAr : t.labelEn}
                          </button>
                        );
                      })}
                    </div>

                    {/* SEO sub-tab content */}
                    {seoTab === "current" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SEO Title</p>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-bold">
                            {seoCurrent?.current?.seo_title || (isArabic ? "لم يتم التوليد بعد" : "Not generated yet")}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SEO Description</p>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed">
                            {seoCurrent?.current?.seo_description || "—"}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">{isArabic ? "الكلمات المفتاحية (40)" : "Keywords (40)"}</p>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                            {seoCurrent?.current?.seo_keywords || "—"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Keywords sub-tab */}
                    {seoTab === "keywords" && (
                      <div className="space-y-4">
                        {(["primary", "longTail", "lsi", "trending"] as const).map((group) => {
                          const labels: Record<string, { ar: string; en: string; dot: string }> = {
                            primary: { ar: "كلمات أساسية (Primary)", en: "Primary Keywords", dot: "bg-indigo-500" },
                            longTail: { ar: "كلمات طويلة (Long-Tail)", en: "Long-Tail Keywords", dot: "bg-emerald-500" },
                            lsi: { ar: "كلمات دلالية (LSI)", en: "LSI Keywords", dot: "bg-amber-500" },
                            trending: { ar: "كلمات رائجة (Trending)", en: "Trending Keywords", dot: "bg-rose-500" },
                          };
                          const items = (seoCurrent?.current?.seo_keyword_strategy?.[group] as string[]) || [];
                          const l = labels[group];
                          return (
                            <div key={group}>
                              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`}></span>
                                {isArabic ? l.ar : l.en} · <span className="text-indigo-600">{items.length}</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {items.length > 0
                                  ? items.map((k, i) => (
                                      <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {k}
                                      </span>
                                    ))
                                  : <span className="text-xs text-slate-400 italic">{isArabic ? "لا توجد كلمات في هذه المجموعة" : "No items in this group"}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* FAQ sub-tab */}
                    {seoTab === "faq" && (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {Array.isArray((seoCurrent as any)?.current?.seo_faq) && (seoCurrent as any).current.seo_faq.length > 0 ? (
                          (seoCurrent as any).current.seo_faq.map((item: any, i: number) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <div className="space-y-1">
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">EN Question</p>
                                <p className="text-sm font-bold text-slate-800">{item.questionEn}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">AR Question</p>
                                <p className="text-sm font-bold text-slate-800" dir="rtl">{item.questionAr}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                <div>
                                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">EN Answer</p>
                                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{item.answerEn}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">AR Answer</p>
                                  <p className="text-xs text-slate-600 leading-relaxed mt-1" dir="rtl">{item.answerAr}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-slate-400 text-xs">
                            {isArabic ? "لا توجد أسئلة شائعة مولّدة بعد" : "No FAQ items yet"}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AEO sub-tab */}
                    {seoTab === "aeo" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                            {isArabic ? "وصف AEO (للذكاء الاصطناعي)" : "AEO Agent Description (for AI crawlers)"}
                          </p>
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-slate-800 leading-relaxed">
                            {seoCurrent?.current?.aeo_agent_description_present
                              ? (isArabic ? "موجود في الـ DB" : "Present in DB")
                              : (isArabic ? "غير مولّد" : "Not generated")}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                            {isArabic ? "قائمة الإمكانيات" : "Capability List"}
                          </p>
                          <div className="space-y-1.5">
                            {Array.isArray((seoCurrent as any)?.current?.aeo_capability_list) &&
                            (seoCurrent as any).current.aeo_capability_list.length > 0 ? (
                              (seoCurrent as any).current.aeo_capability_list.map((cap: string, i: number) => (
                                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                  <span>{cap}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">{isArabic ? "لا توجد إمكانيات" : "No capabilities"}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* History sub-tab */}
                    {seoTab === "history" && (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {seoHistory.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs">
                            {isArabic ? "لا يوجد سجل بعد" : "No history yet"}
                          </div>
                        ) : (
                          seoHistory.map((snap: any, i: number) => (
                            <div key={snap.generatedAt} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    {i === 0 ? (isArabic ? "الحالي" : "CURRENT") : `#${i}`}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-700">{snap.model}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 truncate">{snap.seo_title}</p>
                                <p className="text-[10px] text-slate-500">
                                  {new Date(snap.generatedAt).toLocaleString(isArabic ? "ar-EG" : "en-US")} · ~{snap.tokensEstimated} tokens · {snap.faqCount} FAQ · {snap.capabilityCount} caps
                                </p>
                              </div>
                              {i > 0 && (
                                <button
                                  onClick={() => handleSeoRollback(snap.generatedAt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{isArabic ? "استعادة" : "Restore"}</span>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir={isArabic ? "rtl" : "ltr"}>
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-slate-800">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                <span>{isArabic ? "تعديل صلاحيات العضو:" : "Edit Profile Settings"}</span>
              </h4>
              <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer border-0 bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUserEdit} className="p-5 space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "اسم العضو:" : "Full Name"}</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "البريد الإلكتروني:" : "Email Address"}</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-400 font-semibold cursor-not-allowed"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
                    disabled={editingUser.role === "super_admin"}
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </div>
              </div>

              {/* Permissions checkboxes */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الصلاحيات الممنوحة للمستخدم:" : "Assigned Permissions"}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const currentPermissions: string[] = JSON.parse(editingUser.permissions || "[]");
                    const hasPerm = currentPermissions.includes(perm.code);
                    return (
                      <label key={perm.code} className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
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
                          className="w-3.5 h-3.5 rounded text-indigo-600 bg-white border-slate-350 cursor-pointer"
                          disabled={editingUser.email === "romyatef@gmail.com"}
                        />
                        <span className="text-[10px] font-bold text-slate-700">{isArabic ? perm.nameAr : perm.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir={isArabic ? "rtl" : "ltr"}>
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-slate-800">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                <span>{isArabic ? "إضافة عضو جديد للنظام:" : "Register New Account"}</span>
              </h4>
              <button onClick={() => setIsCreatingUser(false)} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer border-0 bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الاسم الكامل:" : "Full Name"}</label>
                  <input
                    type="text"
                    placeholder="Ramy"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 focus:bg-white"
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
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{isArabic ? "الصلاحيات الممنوحة للعضو:" : "Assigned Permissions"}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const hasPerm = newUser.permissions.includes(perm.code);
                    return (
                      <label key={perm.code} className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
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
                          className="w-3.5 h-3.5 rounded text-indigo-600 bg-white border-slate-350 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-slate-700">{isArabic ? perm.nameAr : perm.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
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
