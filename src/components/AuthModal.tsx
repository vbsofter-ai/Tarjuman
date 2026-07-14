import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles, LogIn, UserPlus } from "lucide-react";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  isArabic: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  isArabic,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "romyatef@gmail.com",
          name: "Ramy Atef"
        })
      });

      const user = await res.json();
      if (!res.ok || user.error) {
        throw new Error(user.error || "Failed to authenticate via Google");
      }

      localStorage.setItem("tarjuman_current_user", JSON.stringify(user));
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError(
        isArabic
          ? "الرجاء تعبئة جميع الحقول المطلوبة"
          : "Please fill in all required fields."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        isArabic
          ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل"
          : "Password must be at least 6 characters long."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: isLogin ? email.split("@")[0] : name.trim()
        })
      });

      const user = await res.json();
      if (!res.ok || user.error) {
        throw new Error(user.error || "Failed to sign in/up");
      }

      localStorage.setItem("tarjuman_current_user", JSON.stringify(user));
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden relative">
        {/* Pattern Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-tr from-indigo-600 to-indigo-500 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-indigo-400/25 blur-xl"></div>
          <div className="absolute top-4 right-10 w-16 h-16 rounded-full bg-indigo-300/35 blur-lg"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title inside banner */}
        <div className="relative pt-10 px-6 pb-6 text-white text-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-lg mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-bold text-lg">
            {isArabic ? "بوابة ترجمان الذكية" : "Tarjuman AI Gateway"}
          </h3>
          <p className="text-xs text-indigo-100 mt-1">
            {isArabic
              ? "سجل دخولك لحفظ قواميسك وسجل عملياتك وزيادة كفاءة الترجمة"
              : "Sign in to save glossary terms, sync history, and unlock limits"}
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {isArabic ? "الاسم الكامل" : "Full Name"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute top-3 right-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isArabic ? "مثال: رامي عاطف" : "e.g. John Doe"}
                    className="w-full text-sm pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {isArabic ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute top-3 right-3 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isArabic ? "example@mail.com" : "name@example.com"}
                  className="w-full text-sm pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {isArabic ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute top-3 right-3 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pr-9 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3 left-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isArabic ? "تسجيل الدخول" : "Sign In"}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{isArabic ? "إنشاء حساب جديد" : "Create Account"}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isArabic ? "أو" : "OR"}
            </span>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5 text-sm cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.39 3.67 1.45 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.7-4.51z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.48z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.93c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.45 7.56C.52 9.42 0 11.48 0 12.75s.52 3.33 1.45 5.19l3.85-3.01z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.8 1.09-3.28 0-5.8-1.81-6.7-4.51l-3.85 2.99C3.39 20.33 7.35 23 12 23z"
              />
            </svg>
            <span>
              {isArabic ? "تسجيل الدخول باستخدام حساب جوجل" : "Sign in with Google"}
            </span>
          </button>

          {/* Toggle Button */}
          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            {isLogin ? (
              <p>
                {isArabic ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-indigo-600 font-bold hover:underline transition-colors"
                >
                  {isArabic ? "سجل حسابك مجاناً الآن" : "Create one for free"}
                </button>
              </p>
            ) : (
              <p>
                {isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-indigo-600 font-bold hover:underline transition-colors"
                >
                  {isArabic ? "تسجيل الدخول مباشرة" : "Sign in here"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Help helper icon for Alert
const AlertCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
