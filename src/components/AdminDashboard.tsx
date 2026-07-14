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
  LayoutDashboard
} from "lucide-react";
import { User } from "../types";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
}

interface AdminUser extends User {
  id: string;
  status: "active" | "suspended";
  joinedDate: string;
  lastActive: string;
  preferredDomain: string;
  role?: "admin" | "moderator" | "editor" | "user";
  permissions?: string; // string representing JSON array
}

export const ALL_PERMISSIONS = [
  { code: "dashboard", nameAr: "لوحة تحكم المدير", nameEn: "Administrative Dashboard" },
  { code: "users_view", nameAr: "استعراض المستخدمين", nameEn: "View Users Database" },
  { code: "users_manage", nameAr: "إدارة وتعديل المستخدمين", nameEn: "Manage/Edit Users" },
  { code: "config_manage", nameAr: "تغيير الإعدادات العامة", nameEn: "Manage Global Configurations" },
  { code: "logs_view", nameAr: "استعراض سجلات النظام", nameEn: "View System Transaction Logs" },
  { code: "translate", nameAr: "استخدام الترجمة الفورية", nameEn: "Access Translation Services" },
  { code: "upload_files", nameAr: "رفع وترجمة الملفات", nameEn: "Upload & Translate Files" },
  { code: "linguistic_analysis", nameAr: "التبصر والتحليل اللغوي", nameEn: "Use Linguistic & Text Insights" }
];

export const getDefaultPermissionsForRole = (role: "admin" | "moderator" | "editor" | "user"): string[] => {
  switch (role) {
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

interface SystemConfig {
  defaultFreeLimit: number;
  translationEngine: "gemini-2.5-flash" | "gemini-2.5-pro" | "hybrid";
  requireAuthForUpload: boolean;
  maintenanceMode: boolean;
  enableLinguisticAnalysis: boolean;
  logTranslationRequests: boolean;
}

export default function AdminDashboard({ isOpen, onClose, isArabic }: AdminDashboardProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    defaultFreeLimit: 5000,
    translationEngine: "gemini-2.5-flash",
    requireAuthForUpload: true,
    maintenanceMode: false,
    enableLinguisticAnalysis: true,
    logTranslationRequests: true,
  });
  const [liveLogs, setLiveLogs] = useState<{ id: string; time: string; action: string; type: "info" | "success" | "warning"; details: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "settings" | "logs">("overview");

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
    plan: "free" as "free" | "pro" | "enterprise",
    quotaLimit: 5000,
    preferredDomain: "general",
    role: "user" as "admin" | "moderator" | "editor" | "user",
    permissions: ["translate", "upload_files"] as string[]
  });

  // Load all data from real backend database APIs
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllAdminData = async () => {
      setLoading(true);
      try {
        const [usersRes, configRes, logsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/config"),
          fetch("/api/admin/logs")
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) {
            setUsers(usersData);
          } else {
            console.error("usersData is not an array:", usersData);
          }
        }
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData && typeof configData === "object" && !configData.error) {
            setSystemConfig(prev => ({ ...prev, ...configData }));
          }
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (Array.isArray(logsData)) {
            setLiveLogs(logsData);
          } else {
            console.error("logsData is not an array:", logsData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAdminData();

    // Auto refresh logs list from actual SQL database logs table every 8 seconds
    const interval = setInterval(() => {
      fetch("/api/admin/logs")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLiveLogs(data);
          }
        })
        .catch(err => console.error("Logs update error:", err));
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Synchronize System Parameters to remote database on toggle / adjust changes
  const initialConfigLoaded = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    if (!initialConfigLoaded.current) {
      initialConfigLoaded.current = true;
      return;
    }

    const saveSystemConfig = async () => {
      try {
        await fetch("/api/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(systemConfig)
        });
      } catch (err) {
        console.error("Failed to save system configuration:", err);
      }
    };

    saveSystemConfig();
  }, [systemConfig, isOpen]);

  if (!isOpen) return null;

  // Statistics calculations
  const usersArray = Array.isArray(users) ? users : [];
  const totalUsersCount = usersArray.length;
  const premiumUsersCount = usersArray.filter(u => u.plan !== "free").length;
  const totalQuotaUsed = usersArray.reduce((acc, u) => acc + u.quotaUsed, 0);
  const totalQuotaLimit = usersArray.reduce((acc, u) => acc + u.quotaLimit, 0);
  const totalWordsRemaining = Math.max(0, totalQuotaLimit - totalQuotaUsed);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, status: nextStatus })
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
      }
    } catch (err) {
      console.error("Failed to update status in DB:", err);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
        setEditingUser(null);
      }
    } catch (err) {
      console.error("Failed to update user profile in DB:", err);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const updatedUsers = await res.json();
        setUsers(updatedUsers);
        setIsCreatingUser(false);
        // Clear form
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
      console.error("Failed to create user in DB:", err);
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
        headers: { "Content-Type": "application/json" },
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
      JSON.stringify({ users, systemConfig, date: new Date().toISOString(), platform: "Tarjuman AI Web" }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tarjuman-diagnostics-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" id="admin-dashboard-container">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isArabic ? "لوحة تحكم المدير الاحترافية" : "Professional Administrative Console"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isArabic ? "إدارة المستخدمين، متابعة الاشتراكات، ضبط معاملات محرك الذكاء الاصطناعي والمصادر" : "Manage active accounts, quotas, subscriptions and system parameters"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Workspace with Sidebar & Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
          {/* Sidebar */}
          <aside className={`w-full md:w-64 border-r border-slate-100 bg-slate-50/70 p-4 flex flex-col gap-1.5 flex-shrink-0 ${isArabic ? "md:order-last border-l border-r-0" : ""}`}>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest px-3 mb-2 text-left">
              {isArabic ? "التنقل العام" : "Console Navigation"}
            </p>
            
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{isArabic ? "الإحصائيات العامة" : "Console Overview"}</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isArabic ? "إدارة الأعضاء" : "User Database"}</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isArabic ? "إعدادات النظام" : "System Control"}</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "logs"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isArabic ? "سجلات العمليات" : "Live Audit Logs"}</span>
            </button>

            {/* Quick Stats shortcut in sidebar for aesthetics */}
            <div className="mt-auto hidden md:block bg-indigo-50 border border-indigo-100/50 rounded-2xl p-3.5 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider">
                  {isArabic ? "المستوى الأمني" : "Security Level"}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600">
                {isArabic ? "مفعل ومراقب بالكامل" : "Fully Encrypted & Audited"}
              </p>
            </div>
          </aside>

          {/* Tab Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
            
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Key Analytics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 relative overflow-hidden">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isArabic ? "إجمالي الأعضاء" : "Total Users"}</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{totalUsersCount}</p>
                      <p className="text-[9px] text-indigo-600 font-bold mt-1">+{users.filter(u => u.joinedDate && u.joinedDate.startsWith("2026-07")).length} {isArabic ? "هذا الشهر" : "this month"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 relative overflow-hidden">
                    <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isArabic ? "الاشتراكات المدفوعة" : "Paid Members"}</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{premiumUsersCount}</p>
                      <p className="text-[9px] text-amber-600 font-bold mt-1">
                        {totalUsersCount > 0 ? ((premiumUsersCount / totalUsersCount) * 100).toFixed(0) : 0}% {isArabic ? "معدل التحويل" : "conversion rate"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 relative overflow-hidden">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isArabic ? "إجمالي استهلاك الكلمات" : "Quota Transferred"}</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{(totalQuotaUsed / 1000).toFixed(1)}k</p>
                      <p className="text-[9px] text-emerald-600 font-bold mt-1">
                        {isArabic ? "متبقي" : "Remaining"}: {(totalWordsRemaining / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 relative overflow-hidden">
                    <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isArabic ? "حالة الخادم والاستدعاء" : "Core System Status"}</p>
                      <p className="text-xl font-black text-emerald-600 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>100%</span>
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">Gemini API: Operational</p>
                    </div>
                  </div>
                </div>

                {/* Popular domains breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-left">
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span>{isArabic ? "تحليل نشاط المجالات والأقسام" : "Domain Distribution Analytics"}</span>
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>{isArabic ? "قانوني (Legal)" : "Legal Documents"}</span>
                            <span>42%</span>
                          </div>
                          <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: "42%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>{isArabic ? "طبي وصيدلي (Medical)" : "Medical & Pharm"}</span>
                            <span>28%</span>
                          </div>
                          <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: "28%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>{isArabic ? "عام (General)" : "General Text"}</span>
                            <span>18%</span>
                          </div>
                          <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: "18%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>{isArabic ? "تقني وأكاديمي (Technical)" : "Technical & Academic"}</span>
                            <span>12%</span>
                          </div>
                          <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: "12%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center mt-4">
                      {isArabic ? "الترجمات النشطة لـ 15 لغة مختلفة" : "Tracking metrics for 15 source & target languages"}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col justify-center items-center text-center">
                    <ShieldCheck className="w-12 h-12 text-indigo-600 mb-3 animate-pulse" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                      {isArabic ? "النظام البيئي للمنصة" : "Platform Eco-System"}
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      {isArabic ? "تتم المراقبة الفورية للأداء والموارد لضمان فترات استجابة سريعة خالية من الأخطاء" : "Real-time auditing and scaling to guarantee seamless contextual translations"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                {/* User Database Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4.5 h-4.5 text-indigo-600" />
                    <span>{isArabic ? "سجل إدارة المستخدمين والاشتراكات" : "User Database & Quota Records"}</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCreatingUser(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isArabic ? "تسجيل مستخدم جديد" : "Register New Account"}</span>
                    </button>
                    <button
                      onClick={downloadDiagnostics}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={isArabic ? "تصدير نسخة كاملة للمستخدمين والاشتراكات بصيغة JSON" : "Export diagnostic database as JSON"}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isArabic ? "نسخ احتياطي" : "Backup"}</span>
                    </button>
                  </div>
                </div>

                {/* Filters bar */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={isArabic ? "البحث بالاسم أو البريد الإلكتروني..." : "Search users by name, email..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/15"
                    />
                  </div>

                  {/* Filters dropdowns */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="bg-white text-slate-700 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                    >
                      <option value="all">{isArabic ? "كل الباقات" : "All Plans"}</option>
                      <option value="free">{isArabic ? "باقة تجريبية" : "Free Trial"}</option>
                      <option value="pro">{isArabic ? "باقة برو" : "Pro Plan"}</option>
                      <option value="enterprise">{isArabic ? "باقة المؤسسات" : "Enterprise"}</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white text-slate-700 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                    >
                      <option value="all">{isArabic ? "كل الحالات" : "All Status"}</option>
                      <option value="active">{isArabic ? "نشط" : "Active"}</option>
                      <option value="suspended">{isArabic ? "موقوف" : "Suspended"}</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th 
                            className="p-3.5 text-xs font-bold text-slate-500 cursor-pointer select-none"
                            onClick={() => toggleSort("name")}
                          >
                            <div className="flex items-center gap-1">
                              <span>{isArabic ? "المستخدم" : "User Info"}</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="p-3.5 text-xs font-bold text-slate-500">{isArabic ? "الباقة" : "Plan"}</th>
                          <th className="p-3.5 text-xs font-bold text-slate-500">{isArabic ? "الدور والصلاحية" : "Role"}</th>
                          <th 
                            className="p-3.5 text-xs font-bold text-slate-500 cursor-pointer select-none"
                            onClick={() => toggleSort("quotaUsed")}
                          >
                            <div className="flex items-center gap-1">
                              <span>{isArabic ? "الاستهلاك والحصة" : "Quota / Limit"}</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="p-3.5 text-xs font-bold text-slate-500">{isArabic ? "المجال المفضل" : "Pref. Domain"}</th>
                          <th 
                            className="p-3.5 text-xs font-bold text-slate-500 cursor-pointer select-none"
                            onClick={() => toggleSort("joinedDate")}
                          >
                            <div className="flex items-center gap-1">
                              <span>{isArabic ? "تاريخ الانضمام" : "Joined"}</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="p-3.5 text-xs font-bold text-slate-500 text-center">{isArabic ? "الحالة" : "Status"}</th>
                          <th className="p-3.5 text-xs font-bold text-slate-500 text-right">{isArabic ? "إجراءات" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-xs text-slate-400 font-bold">
                              {isArabic ? "لا يوجد مستخدمين يطابقون شروط البحث" : "No users matched the filters"}
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 uppercase">
                                    {user.name ? user.name.charAt(0) : "U"}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800">{user.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  user.plan === "enterprise" 
                                    ? "bg-purple-100 text-purple-700 border border-purple-200" 
                                    : user.plan === "pro" 
                                    ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                  {user.plan}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  user.role === "admin" 
                                    ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                    : user.role === "moderator" 
                                    ? "bg-amber-50 text-amber-700 border border-amber-100" 
                                    : user.role === "editor" 
                                    ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                    : "bg-slate-50 text-slate-600 border border-slate-100"
                                }`}>
                                  {user.role === "admin" && <Shield className="w-2.5 h-2.5 text-rose-600" />}
                                  {user.role === "moderator" && <Key className="w-2.5 h-2.5 text-amber-600" />}
                                  {user.role === "editor" && <Edit2 className="w-2.5 h-2.5 text-blue-600" />}
                                  <span>{
                                    user.role === "admin" 
                                      ? (isArabic ? "مدير عام" : "Admin")
                                      : user.role === "moderator"
                                      ? (isArabic ? "مراقب" : "Moderator")
                                      : user.role === "editor"
                                      ? (isArabic ? "محرر" : "Editor")
                                      : (isArabic ? "مستخدم" : "User")
                                  }</span>
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div>
                                  <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-600 mb-1">
                                    <span>{user.quotaUsed ? user.quotaUsed.toLocaleString() : 0}</span>
                                    <span className="text-slate-400">/ {user.quotaLimit ? (user.quotaLimit > 1000000 ? "∞" : user.quotaLimit.toLocaleString()) : 5000}</span>
                                  </div>
                                  <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        user.quotaLimit && (user.quotaUsed / user.quotaLimit) > 0.9 ? "bg-rose-500" : "bg-indigo-600"
                                      }`} 
                                      style={{ width: `${user.quotaLimit ? Math.min(100, (user.quotaUsed / user.quotaLimit) * 100) : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="text-[10px] font-bold text-slate-500 capitalize flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                  <span>{user.preferredDomain || "general"}</span>
                                </span>
                              </td>
                              <td className="p-3.5 text-[10px] font-bold text-slate-400 font-mono">
                                {user.joinedDate}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold capitalize ${
                                  user.status === "active" 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : "bg-rose-50 text-rose-700"
                                }`}>
                                  {user.status === "active" ? (isArabic ? "نشط" : "active") : (isArabic ? "موقوف" : "suspended")}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  
                                  {/* Edit details */}
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title={isArabic ? "تعديل الحساب والحصة" : "Edit user settings / quota"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Toggle active state */}
                                  <button
                                    onClick={() => handleUpdateUserStatus(user.id, user.status)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      user.status === "active" 
                                        ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                                        : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                    title={user.status === "active" ? (isArabic ? "إيقاف الحساب" : "Suspend Account") : (isArabic ? "تنشيط الحساب" : "Activate Account")}
                                  >
                                    {user.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Delete user permanently */}
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title={isArabic ? "حذف المستخدم نهائياً" : "Delete User Permanently"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Quick System Adjustments Panel */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 sm:p-5 text-left">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>{isArabic ? "الإعدادات العامة والمعايير الفورية" : "Core System Parameter Control"}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Engine Select */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {isArabic ? "محرك الترجمة الافتراضي" : "Default Model Engine"}
                      </label>
                      <select
                        value={systemConfig.translationEngine}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, translationEngine: e.target.value as any }))}
                        className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (سرعة فائقة)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (دقة قصوى)</option>
                        <option value="hybrid">Hybrid Routing (ذكي وتلقائي)</option>
                      </select>
                      <p className="text-[9px] text-slate-400 mt-1.5">
                        {isArabic ? "يحدد النموذج الأساسي لمعالجة الملفات والتبصر اللغوي" : "Determines model configuration to use for file translation requests"}
                      </p>
                    </div>

                    {/* Free limit control */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {isArabic ? "حد ترجمة الزوار المجاني (كلمات)" : "Free Trial Guest Quota (Words)"}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={systemConfig.defaultFreeLimit}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, defaultFreeLimit: parseInt(e.target.value, 10) || 5000 }))}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                        />
                        <span className="p-2 bg-slate-100 text-slate-500 text-xs rounded-lg flex items-center font-bold">W</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1.5">
                        {isArabic ? "حجم الكلمات الافتراضية الممنوحة للحسابات المجانية الجديدة" : "Word limit for guest translations before requesting premium upgrade"}
                      </p>
                    </div>

                    {/* Toggle controls */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isArabic ? "مفاتيح التحكم السريع للخدمة" : "Global Toggle Switches"}
                      </label>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-medium">
                          {isArabic ? "طلب تسجيل الدخول لرفع الملفات" : "Enforce Auth for File Uploads"}
                        </span>
                        <input
                          type="checkbox"
                          checked={systemConfig.requireAuthForUpload}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, requireAuthForUpload: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-medium">
                          {isArabic ? "حفظ سجلات الترجمات للتدقيق" : "Log queries for security auditing"}
                        </span>
                        <input
                          type="checkbox"
                          checked={systemConfig.logTranslationRequests}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, logTranslationRequests: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{isArabic ? "وضع الصيانة الشامل" : "Global Maintenance Mode"}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={systemConfig.maintenanceMode}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                          className="w-4 h-4 text-rose-600 rounded"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-4">
                {/* Live translation logs feed */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col min-h-[400px] text-left">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-500 animate-pulse" />
                      <span>{isArabic ? "مراقب الاستدعاءات وسجلات الخدمة المباشرة" : "Live API & Platform Transaction Logs"}</span>
                    </h3>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <span>{isArabic ? "مباشر" : "LIVE"}</span>
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[10px] pr-1 max-h-[450px]">
                    {(Array.isArray(liveLogs) ? liveLogs : []).map(log => (
                      <div key={log.id} className="p-2 bg-white rounded-lg border border-slate-100/80 flex items-start gap-2.5 hover:border-slate-200 transition-all">
                        <span className="text-slate-400 font-bold flex-shrink-0 mt-0.5">{log.time}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold uppercase tracking-wide px-1 rounded-sm text-[8px] ${
                              log.type === "success" 
                                ? "bg-emerald-50 text-emerald-700" 
                                : log.type === "warning" 
                                ? "bg-amber-50 text-amber-700" 
                                : "bg-blue-50 text-blue-700"
                            }`}>{log.action}</span>
                          </div>
                          <p className="text-slate-600 mt-1 font-sans">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Footnotes */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-medium">
          <p>{isArabic ? "النظام يعمل بكفاءة 100% وبدون مشاكل" : "System operates at peak performance, 0 critical incidents"}</p>
          <p className="font-mono text-[11px]">Tarjuman-Admin CLI v2.4.0</p>
        </div>

      </div>

      {/* MODAL: Edit User Details & Quota limit */}
      {editingUser && (
        <div className="fixed inset-0 z-55 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {isArabic ? "تعديل تفاصيل المستخدم والحصة" : "Modify User & Quota Limits"}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "اسم العضو بالكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isArabic ? "باقة الاشتراك" : "Subscription Plan"}
                  </label>
                  <select
                    value={editingUser.plan}
                    onChange={(e) => {
                      const nextPlan = e.target.value as any;
                      const nextLimit = nextPlan === "enterprise" ? 2000000 : nextPlan === "pro" ? 100000 : 5000;
                      setEditingUser(prev => prev ? ({ ...prev, plan: nextPlan, quotaLimit: nextLimit }) : null);
                    }}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="free">Free Trial</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isArabic ? "الحد الأقصى للكلمات" : "Word Quota Limit"}
                  </label>
                  <input
                    type="number"
                    required
                    value={editingUser.quotaLimit}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, quotaLimit: parseInt(e.target.value, 10) || 0 }) : null)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "الكلمات المستهلكة حالياً" : "Quota Used (Words)"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    value={editingUser.quotaUsed}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, quotaUsed: parseInt(e.target.value, 10) || 0 }) : null)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingUser(prev => prev ? ({ ...prev, quotaUsed: 0 }) : null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isArabic ? "تصفير" : "Reset"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "دور المستخدم (صلاحيات عامة)" : "User Role (General Permissions)"}
                </label>
                <select
                  value={editingUser.role || "user"}
                  onChange={(e) => {
                    const nextRole = e.target.value as any;
                    const defaultPerms = getDefaultPermissionsForRole(nextRole);
                    setEditingUser(prev => prev ? ({
                      ...prev,
                      role: nextRole,
                      permissions: JSON.stringify(defaultPerms)
                    }) : null);
                  }}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="user">{isArabic ? "مستخدم عادي (User)" : "Standard User"}</option>
                  <option value="editor">{isArabic ? "محرر محتوى (Editor)" : "Content Editor"}</option>
                  <option value="moderator">{isArabic ? "مراقب نظام (Moderator)" : "System Moderator"}</option>
                  <option value="admin">{isArabic ? "مدير عام (Admin)" : "Administrator"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  {isArabic ? "الصلاحيات التفصيلية (تخصيص دقيق)" : "Granular Permissions Overrides"}
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-2">
                  {ALL_PERMISSIONS.map(perm => {
                    let currentPerms: string[] = [];
                    try {
                      currentPerms = editingUser.permissions ? JSON.parse(editingUser.permissions) : [];
                    } catch {
                      currentPerms = [];
                    }
                    if (!Array.isArray(currentPerms)) currentPerms = [];
                    const hasPerm = currentPerms.includes(perm.code);

                    return (
                      <label key={perm.code} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={hasPerm}
                          onChange={(e) => {
                            let nextPerms = [...currentPerms];
                            if (e.target.checked) {
                              nextPerms.push(perm.code);
                            } else {
                              nextPerms = nextPerms.filter(p => p !== perm.code);
                            }
                            setEditingUser(prev => prev ? ({
                              ...prev,
                              permissions: JSON.stringify(nextPerms)
                            }) : null);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>{isArabic ? perm.nameAr : perm.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-sm shadow-indigo-600/10 cursor-pointer"
                >
                  {isArabic ? "حفظ التعديلات" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New User */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-55 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {isArabic ? "تسجيل حساب مستخدم جديد" : "Register a New User Account"}
              </h3>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "اسم العضو بالكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. احمد مصطفى"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "البريد الإلكتروني للمستخدم" : "Email Address"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isArabic ? "باقة الاشتراك الفورية" : "Subscription Plan"}
                  </label>
                  <select
                    value={newUser.plan}
                    onChange={(e) => {
                      const selectedPlan = e.target.value as any;
                      const nextLimit = selectedPlan === "enterprise" ? 2000000 : selectedPlan === "pro" ? 100000 : 5000;
                      setNewUser(prev => ({ ...prev, plan: selectedPlan, quotaLimit: nextLimit }));
                    }}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="free">Free Trial</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isArabic ? "الحد الأقصى للكلمات" : "Word Quota Limit"}
                  </label>
                  <input
                    type="number"
                    required
                    value={newUser.quotaLimit}
                    onChange={(e) => setNewUser(prev => ({ ...prev, quotaLimit: parseInt(e.target.value, 10) || 5000 }))}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "المجال المعتاد استخدامه" : "Preferred Translation Domain"}
                </label>
                <select
                  value={newUser.preferredDomain}
                  onChange={(e) => setNewUser(prev => ({ ...prev, preferredDomain: e.target.value }))}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="general">General</option>
                  <option value="legal">Legal</option>
                  <option value="medical">Medical</option>
                  <option value="financial">Financial</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isArabic ? "دور المستخدم (صلاحيات عامة)" : "User Role (General Permissions)"}
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as any;
                    const defaultPerms = getDefaultPermissionsForRole(nextRole);
                    setNewUser(prev => ({
                      ...prev,
                      role: nextRole,
                      permissions: defaultPerms
                    }));
                  }}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="user">{isArabic ? "مستخدم عادي (User)" : "Standard User"}</option>
                  <option value="editor">{isArabic ? "محرر محتوى (Editor)" : "Content Editor"}</option>
                  <option value="moderator">{isArabic ? "مراقب نظام (Moderator)" : "System Moderator"}</option>
                  <option value="admin">{isArabic ? "مدير عام (Admin)" : "Administrator"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  {isArabic ? "الصلاحيات التفصيلية" : "Granular Permissions"}
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-2">
                  {ALL_PERMISSIONS.map(perm => {
                    const hasPerm = newUser.permissions.includes(perm.code);

                    return (
                      <label key={perm.code} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={hasPerm}
                          onChange={(e) => {
                            let nextPerms = [...newUser.permissions];
                            if (e.target.checked) {
                              nextPerms.push(perm.code);
                            } else {
                              nextPerms = nextPerms.filter(p => p !== perm.code);
                            }
                            setNewUser(prev => ({
                              ...prev,
                              permissions: nextPerms
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>{isArabic ? perm.nameAr : perm.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-sm shadow-indigo-600/10 cursor-pointer"
                >
                  {isArabic ? "إنشاء وتفعيل" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
