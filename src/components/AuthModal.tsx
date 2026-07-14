import React, { useState, useEffect } from "react";
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
  const [showGoogleMock, setShowGoogleMock] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogleButton = () => {
      const google = (window as any).google;
      if (!google) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          setLoading(true);
          setError("");
          try {
            // Decode Google JWT Credential payload (base64)
            const base64Url = response.credential.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            const payload = JSON.parse(jsonPayload);

            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: payload.email,
                name: payload.name || payload.given_name
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
            setError(err.message || "Google Authentication error");
          } finally {
            setLoading(false);
          }
        }
      });

      const container = document.getElementById("google-signin-btn-container");
      if (container) {
        google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          width: "360",
          text: "signin_with",
          locale: isArabic ? "ar" : "en"
        });
      }
    };

    if (!(window as any).google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleButton();
      };
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogleButton, 100);
    }
  }, [isOpen, isArabic]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError("");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (clientId) {
      setLoading(true);
      try {
        if (typeof window !== "undefined") {
          // If google client script is not loaded, inject it dynamically
          if (!(window as any).google) {
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            await new Promise((resolve) => (script.onload = resolve));
          }

          const google = (window as any).google;
          google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              try {
                // Decode Google JWT Credential payload (base64)
                const base64Url = response.credential.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
                );
                const payload = JSON.parse(jsonPayload);

                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: payload.email,
                    name: payload.name || payload.given_name
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
                setError(err.message || "Google Authentication error");
              } finally {
                setLoading(false);
              }
            }
          });

          google.accounts.id.prompt();
        }
      } catch (err: any) {
        setError(err.message || "Failed to launch Google Sign-in flow");
        setLoading(false);
      }
    } else {
      // Trigger developer sandbox mock prompt
      setShowGoogleMock(true);
    }
  };

  const handleGoogleMockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) {
      setError(isArabic ? "يرجى إدخال البريد الإلكتروني" : "Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail.trim().toLowerCase(),
          name: googleName.trim() || googleEmail.split("@")[0]
        })
      });

      const user = await res.json();
      if (!res.ok || user.error) {
        throw new Error(user.error || "Failed to sign in via Google Sandbox");
      }

      localStorage.setItem("tarjuman_current_user", JSON.stringify(user));
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Google Sandbox Sign-in error");
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      {/* Decorative background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Pattern Background */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent border-b border-slate-800/40 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-indigo-500/20 blur-xl"></div>
          <div className="absolute top-4 right-10 w-16 h-16 rounded-full bg-indigo-400/15 blur-lg"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title inside banner */}
        <div className="relative pt-8 px-6 pb-4 text-center">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-md mb-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="font-black text-base tracking-tight text-white">
            {isArabic ? "بوابة ترجمان الذكية" : "Tarjuman AI Gateway"}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
            {isArabic
              ? "سجل دخولك لحفظ قواميسك وسجل عملياتك وزيادة كفاءة الترجمة"
              : "Sign in to save glossary terms, sync history, and unlock limits"}
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 pr-6 pl-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {showGoogleMock ? (
            <form onSubmit={handleGoogleMockSubmit} className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] p-3.5 rounded-2xl space-y-1 text-right" dir="rtl">
                <h4 className="font-bold flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول التجريبي بحساب جوجل (Google Sandbox)</span>
                </h4>
                <p className="text-slate-400 leading-normal">
                  {isArabic 
                    ? "لم يتم العثور على NEXT_PUBLIC_GOOGLE_CLIENT_ID في ملف الإعدادات. للتجربة السريعة، يرجى كتابة بريدك الإلكتروني والاسم:" 
                    : "No Google Client ID configured in your configurations. For local testing, please enter any email and name to sign in:"}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {isArabic ? "بريد جوجل الإلكتروني" : "Google Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 right-3 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full text-base md:text-xs pr-10 pl-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300 text-left font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {isArabic ? "الاسم الكامل (اختياري)" : "Full Name (Optional)"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute top-3 right-3 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Ramy Atef"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full text-base md:text-xs pr-10 pl-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300 text-left font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleMock(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-2xl text-xs border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  {isArabic ? "رجوع" : "Back"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{isArabic ? "تسجيل دخول تجريبي" : "Confirm Sign In"}</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                      {isArabic ? "الاسم الكامل" : "Full Name"}
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute top-3.5 right-3 text-slate-500 w-4 h-4" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isArabic ? "مثال: رامي عاطف" : "e.g. John Doe"}
                        className="w-full text-base md:text-sm pr-9 pl-3 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                    {isArabic ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-3.5 right-3 text-slate-500 w-4 h-4" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isArabic ? "example@mail.com" : "name@example.com"}
                      className="w-full text-base md:text-sm pr-9 pl-3 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                    {isArabic ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-3.5 right-3 text-slate-500 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-base md:text-sm pr-9 pl-10 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3.5 left-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
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
                  <div className="w-full border-t border-slate-800/80"></div>
                </div>
                <span className="relative bg-slate-900 px-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                  {isArabic ? "أو" : "OR"}
                </span>
              </div>

              {/* Google Sign-In Button */}
              <div className="w-full flex flex-col items-center gap-2 mt-2">
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <div id="google-signin-btn-container" className="w-full flex justify-center py-1 bg-white rounded-2xl p-1 border border-slate-200"></div>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2.5 text-xs cursor-pointer active:scale-95 disabled:opacity-50"
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
                      {isArabic ? "تسجيل الدخول التجريبي بحساب جوجل" : "Sign in with Google (Sandbox)"}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Toggle Button */}
          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
            {isLogin ? (
              <p>
                {isArabic ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer hover:underline"
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
                  className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer hover:underline"
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
