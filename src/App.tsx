"use client";

import { useState, useEffect, useRef } from "react";
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Bookmark,
  Trash,
  Settings,
  AlertCircle,
  HelpCircle,
  BookOpenCheck,
  History,
  Star,
  BookOpen,
  Sprout,
  Briefcase,
  Heart,
  TrendingUp,
  FileText,
  Cpu,
  GraduationCap,
  MessageSquare,
  PenTool,
  Loader,
  LogOut,
  Coins,
  Download,
  FileDown,
  User as UserIcon,
  CheckCircle2,
  Lock,
  ShieldCheck,
  PencilLine,
  Zap,
  Loader2,
  X,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  LanguageCode,
  DomainCode,
  ToneCode,
  GlossaryTerm,
  FileData,
  HistoryItem,
  TranslationResult,
  User
} from "./types";
import { LANGUAGES, DOMAINS, TONES, SAMPLE_TEXTS, PRICING_PLANS } from "./constants";
import { GlossaryManager } from "./components/GlossaryManager";
import { FileTranslator } from "./components/FileTranslator";
import { HistorySidebar } from "./components/HistorySidebar";
import { AuthModal } from "./components/AuthModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { PricingTable } from "./components/PricingTable";
import AdBanner from "./components/AdBanner";

function TypewriterTranslation({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }
    
    let currentIndex = 0;
    setDisplayedText(""); // Reset text first
    
    const stepTime = Math.max(5, Math.min(25, 300 / text.length));
    
    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {displayedText}
    </motion.div>
  );
}

export default function App() {
  // Localization state (Bilingual UI: "ar" by default, toggles to "en")
  const [uiLang, setUiLang] = useState<"ar" | "en">("ar");
  const isArabic = uiLang === "ar";

  // Resolve language code or name to Language object helper
  const resolveLanguage = (langStr: string) => {
    const normalized = langStr.trim().toLowerCase();
    // Try matching code directly
    const foundByCode = LANGUAGES.find((l) => l.code === normalized);
    if (foundByCode) return foundByCode;
    // Try matching name or nativeName
    const foundByName = LANGUAGES.find(
      (l) => l.name.toLowerCase() === normalized || l.nativeName.toLowerCase() === normalized
    );
    if (foundByName) return foundByName;
    return null;
  };

  // Translation workspace states
  const [sourceLang, setSourceLang] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tarjuman_source_lang") as LanguageCode) || "auto";
    }
    return "auto";
  });
  const [targetLang, setTargetLang] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tarjuman_target_lang") as LanguageCode) || "en";
    }
    return "en";
  });
  const [domain, setDomain] = useState<DomainCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tarjuman_domain") as DomainCode) || "general";
    }
    return "general";
  });
  const [tone, setTone] = useState<ToneCode>("formal");

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [detectionConfidence, setDetectionConfidence] = useState<number | undefined>(undefined);
  const [alternativeLanguages, setAlternativeLanguages] = useState<string[]>([]);
  const [linguisticAnalysis, setLinguisticAnalysis] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [glossaryApplied, setGlossaryApplied] = useState<{ source: string; target: string }[]>([]);

  // Glossary state
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);

  // Attachment state
  const [fileAttached, setFileAttached] = useState<FileData | null>(null);

  // History & Favorites state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  // App running states
  const [isTranslating, setIsTranslating] = useState(false);
  const [retryStatus, setRetryStatus] = useState<{ attempt: number; max: number; waitMs: number; reason: string } | null>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  // Auto-translate: when ON, the translator runs automatically 1s after the
  // user stops typing. Disabled for unauthenticated users (we don't want
  // their 3 free trial credits to be eaten by a single typing session).
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);
  const [autoTranslating, setAutoTranslating] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  // Feedback states
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Authenticated User & Pricing subscription states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState("");
  const [subscribingPlan, setSubscribingPlan] = useState<"free" | "pro" | "enterprise" | null>(null);
  const [billingProvider, setBillingProvider] = useState<"paymob" | "paypal">("paymob");
  // Open Source / Free Mode — admin toggle that makes the project fully free
  const [openSourceMode, setOpenSourceMode] = useState(false);
  // Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");


  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch public system config on mount + on tab focus
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/public/config", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data) return;
        
        if (data.openSource) {
          setOpenSourceMode(Boolean(data.openSource.enabled));
        }
        
        if (data.maintenance) {
          setMaintenanceMode(Boolean(data.maintenance.enabled));
          setMaintenanceMessage(data.maintenance.message || "");
        }
      } catch {
        // Silent — never break the app on a config read failure
      }
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Sync LocalStorage for history and glossary on startup
  useEffect(() => {
    // Track site visit
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: typeof document !== "undefined" ? document.referrer : "",
        path: window.location.pathname
      })
    }).catch(err => console.error("Analytics tracking error:", err));

    const savedHistory = localStorage.getItem("tarjuman_history");
    const savedGlossary = localStorage.getItem("tarjuman_glossary");

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    if (savedGlossary) {
      try {
        setGlossary(JSON.parse(savedGlossary));
      } catch (e) {
        console.error("Failed to parse glossary", e);
      }
    }

    const savedUser = localStorage.getItem("tarjuman_current_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse current user", e);
      }
    }

    // Default target language adaptation
    const savedTargetLang = localStorage.getItem("tarjuman_target_lang");
    if (!savedTargetLang) {
      if (isArabic) {
        setTargetLang("en");
      } else {
        setTargetLang("ar");
      }
    }
  }, []);

  // Save choices to LocalStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tarjuman_source_lang", sourceLang);
      localStorage.setItem("tarjuman_target_lang", targetLang);
      localStorage.setItem("tarjuman_domain", domain);
    }
  }, [sourceLang, targetLang, domain]);

  // Reset feedback widget when text changes
  useEffect(() => {
    setUserRating(null);
    setHoveredRating(null);
    setFeedbackComment("");
    setFeedbackSubmitted(false);
  }, [sourceText]);

  // ---------------------------------------------------------------------
  // Real-time auto-translate (debounced).
  //
  // When the user stops typing for AUTO_TRANSLATE_DEBOUNCE_MS, the
  // translator fires automatically — as long as the feature is on, the
  // user is signed in (to preserve unauth free-trial credits), no file
  // is attached (file translation is always explicit), the text is long
  // enough, and we're not already translating.
  //
  // We cancel any in-flight request when new text arrives via the
  // existing abortControllerRef, so users see a fresh result on the
  // latest text without an old request overwriting it.
  // ---------------------------------------------------------------------
  const AUTO_TRANSLATE_DEBOUNCE_MS = 1000;
  const AUTO_TRANSLATE_MIN_CHARS = 3;
  const autoTranslateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoTranslate) return;
    if (!sourceText || sourceText.trim().length < AUTO_TRANSLATE_MIN_CHARS) return;
    if (fileAttached) return; // explicit-only when a file is attached
    if (!currentUser) return; // preserve unauth free-trial credits
    if (isTranslating) return; // don't pile on top of an in-flight request

    // Reset the debounce timer on every keystroke
    if (autoTranslateTimerRef.current) clearTimeout(autoTranslateTimerRef.current);

    autoTranslateTimerRef.current = setTimeout(() => {
      // Bail out if state changed in the meantime
      if (isTranslating) return;
      setAutoTranslating(true);
      handleTranslate(undefined, undefined, { mode: "auto" }).finally(() => {
        setAutoTranslating(false);
      });
    }, AUTO_TRANSLATE_DEBOUNCE_MS);

    return () => {
      if (autoTranslateTimerRef.current) {
        clearTimeout(autoTranslateTimerRef.current);
        autoTranslateTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText, autoTranslate, fileAttached, currentUser?.email]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating) return;

    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser?.email || "anonymous",
          rating: userRating,
          comment: feedbackComment.trim(),
          details: `Source: ${sourceLang} -> Target: ${targetLang} | Domain: ${domain}`
        })
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Save history helper
  const saveHistoryToStorage = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("tarjuman_history", JSON.stringify(newHistory));
  };

  // Auth & Subscription handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("tarjuman_current_user");
    setShowProfileDropdown(false);
  };

  const handleSubscribe = async (
    planId: "free" | "pro" | "enterprise",
    billingPeriod: "monthly" | "yearly" = "monthly",
    provider: "paymob" | "paypal" = "paymob"
  ): Promise<void> => {
    if (!currentUser) {
      // User is not signed in. Open AuthModal first!
      setShowAuthModal(true);
      return;
    }

    // Open Source / Free Mode — admin has flipped the kill switch for
    // subscriptions. All paid plans are free right now; just upgrade the
    // user to the requested plan via the subscribe endpoint and show the
    // success modal. The endpoint already returns the upgraded user.
    try {
      if (openSourceMode) {
        setSubscribingPlan(planId);
        const res = await fetch("/api/auth/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentUser.email, planId }),
        });
        const data = await res.json();
        if (!res.ok || data?.error) {
          throw new Error(data?.error || "Failed to upgrade (open source mode)");
        }
        setCurrentUser(data);
          localStorage.setItem("tarjuman_current_user", JSON.stringify(data));
          setSuccessPlanName(
            planId === "pro"
              ? (isArabic ? "الباقة الاحترافية (مجانية حالياً)" : "Pro Plan (free during open-source mode)")
              : planId === "enterprise"
              ? (isArabic ? "باقة الشركات (مجانية حالياً)" : "Enterprise (free during open-source mode)")
              : (isArabic ? "الباقة المجانية" : "Free Plan")
          );
          setShowUpgradeSuccess(true);
          setShowPricingModal(false);
          setSubscribingPlan(null);
          return;
      }
    } catch (e) {
      // If the open-source upgrade fails, fall through to the normal flow
      console.warn("Open-source mode upgrade failed; falling back to normal flow", e);
    }

    // If a billing period toggle is shown next to the modal, the caller
    // passes it through; otherwise we default to monthly.

    if (planId === "free") {
      // Free plan: apply directly via the legacy subscribe endpoint
      // (no payment required).
      try {
        const res = await fetch("/api/auth/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentUser.email, planId: "free" }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to update subscription");
        }
        setCurrentUser(data);
        localStorage.setItem("tarjuman_current_user", JSON.stringify(data));
        setSuccessPlanName(isArabic ? "الباقة المجانية" : "Free Plan");
        setShowUpgradeSuccess(true);
        setShowPricingModal(false);
      } catch (err: any) {
        console.error("Subscription downgrade error:", err);
        setError(isArabic ? "فشل تحديث الباقة. حاول مرة أخرى." : "Failed to update plan. Please try again.");
      }
      return;
    }

    // Paid plan: drive the new multi-provider flow.
    try {
      setSubscribingPlan(planId);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          planId,
          billingPeriod,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to start checkout");
      }
      // Paymob → iframeUrl ; PayPal → approvalUrl
      const target = data?.iframeUrl || data?.approvalUrl;
      if (target) {
        // Persist intent for the success page to know which user to refresh.
        try {
          sessionStorage.setItem("tarjuman_pending_payment", data.paymentId || "");
          sessionStorage.setItem("tarjuman_pending_provider", provider);
        } catch {}
        // Redirect the user to the gateway's hosted checkout.
        window.location.href = target;
        return;
      }
    } catch (err: any) {
      console.error("Subscription checkout error:", err);
      setError(
        isArabic
          ? (err?.message || "فشل بدء عملية الدفع. حاول مرة أخرى.")
          : (err?.message || "Failed to start checkout. Please try again.")
      );
    } finally {
      setSubscribingPlan(null);
    }
  };

  // Preserved formatting translated file download
  const handleDownloadTranslatedFile = () => {
    if (!fileAttached || !translatedText) return;

    const originalName = fileAttached.name;
    const dotIndex = originalName.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const extension = dotIndex !== -1 ? originalName.substring(dotIndex) : ".txt";

    let translatedFileName = "";
    let blob: Blob;

    // Preserved formatting download logic
    if (extension.toLowerCase() === ".txt") {
      translatedFileName = `${baseName}_translated_${targetLang}.txt`;
      blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    } else {
      // For any other file type (PDF, docx, image), download it as a styled .html file to preserve format!
      translatedFileName = `${baseName}_translated_${targetLang}.html`;
      const docHtml = `
<!DOCTYPE html>
<html dir="${targetLang === "ar" || targetLang === "ur" ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <title>${translatedFileName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Inter:wght@400;500;600&display=swap');
    body {
      font-family: 'Tajawal', 'Inter', sans-serif;
      padding: 50px;
      color: #1e293b;
      line-height: 1.7;
      background-color: #f8fafc;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      border-bottom: 2px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #4338ca;
    }
    .meta {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .content {
      font-size: 14px;
      white-space: pre-wrap;
      color: #334155;
    }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${isArabic ? "مستند مترجم عبر بوابة ترجمان" : "Translated Document via Tarjuman"}</div>
      <div class="meta">${isArabic ? "الملف الأصلي:" : "Original:"} ${originalName}</div>
    </div>
    <div class="content">${translatedText}</div>
    <div class="footer">
      ${isArabic ? "تم حفظ التنسيق والترجمة اللغوية المتخصصة تلقائياً عبر منصة ترجمان الذكية" : "Format and precise terminology preserved by Tarjuman Neural Translation Engine."}
    </div>
  </div>
</body>
</html>
      `;
      blob = new Blob([docHtml], { type: "text/html;charset=utf-8" });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = translatedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export translation directly to a formatted PDF file using a beautiful, print-ready document template
  const handleExportPDF = () => {
    if (!translatedText) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(isArabic ? "يرجى السماح بالنوافذ المنبثقة لتصدير مستند PDF" : "Please allow popups to export the PDF document.");
      return;
    }

    const currentDomain = DOMAINS.find((d) => d.code === domain);
    const currentTone = TONES.find((t) => t.code === tone);
    const sourceLangName = LANGUAGES.find((l) => l.code === sourceLang)?.name || sourceLang;
    const targetLangName = LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;

    const reportTitle = isArabic ? "تقرير ترجمة ترجمان المهني" : "Tarjuman Professional Translation Report";
    const dateStr = new Date().toLocaleString(isArabic ? "ar-EG" : "en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const isTargetRtl = targetLang === "ar" || targetLang === "ur";
    const isSourceRtl = sourceLang === "ar" || sourceLang === "ur" || (sourceLang === "auto" && detectedLang === "ar");

    const htmlContent = `
<!DOCTYPE html>
<html dir="${isArabic ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
    
    body {
      font-family: 'Tajawal', 'Inter', sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
    }

    .header-container {
      border-bottom: 2px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      background-color: #4f46e5;
      color: #ffffff;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      font-family: 'Inter', sans-serif;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.5px;
      font-family: 'Inter', sans-serif;
    }

    .report-badge {
      background-color: #e0e7ff;
      color: #4338ca;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      border: 1px solid #c7d2fe;
    }

    .metadata-grid {
      display: grid;
      grid-template-cols: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
      background-color: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
      letter-spacing: 0.5px;
    }

    .meta-value {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .text-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
      min-height: 100px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .source-text {
      direction: ${isSourceRtl ? "rtl" : "ltr"};
      text-align: ${isSourceRtl ? "right" : "left"};
      font-size: 14px;
      color: #475569;
    }

    .translated-text {
      direction: ${isTargetRtl ? "rtl" : "ltr"};
      text-align: ${isTargetRtl ? "right" : "left"};
      font-size: 15px;
      font-weight: 500;
      color: #0f172a;
    }

    .analysis-container {
      background-color: #faf5ff;
      border: 1px solid #f3e8ff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }

    .analysis-text {
      font-size: 13px;
      color: #5b21b6;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .applied-glossary {
      margin-top: 15px;
      background-color: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 12px;
      padding: 15px;
    }

    .glossary-title {
      font-size: 13px;
      font-weight: bold;
      color: #065f46;
      margin-bottom: 8px;
    }

    .glossary-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .glossary-tag {
      background-color: #ffffff;
      border: 1px solid #a7f3d0;
      color: #047857;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
    }

    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
    }

    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="logo-area">
      <div class="logo-icon">T</div>
      <div class="logo-text">Tarjuman</div>
    </div>
    <div class="report-badge">
      ${isArabic ? "تقرير ترجمة صياغية معتمد" : "Certified Translation Report"}
    </div>
  </div>

  <div class="metadata-grid">
    <div class="meta-item">
      <span class="meta-label">${isArabic ? "تاريخ الإصدار والوقت" : "Issue Date & Time"}</span>
      <span class="meta-value">${dateStr}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${isArabic ? "مستوى دقة الكشف والتوجيه" : "Translation Routing"}</span>
      <span class="meta-value">
        ${sourceLangName.toUpperCase()} ➔ ${targetLangName.toUpperCase()}
      </span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${isArabic ? "المجال التخصصي" : "Specialized Domain"}</span>
      <span class="meta-value">
        ${isArabic ? currentDomain?.labelAr || domain : currentDomain?.labelEn || domain}
      </span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${isArabic ? "النبرة والأسلوب" : "Tone & Style"}</span>
      <span class="meta-value">
        ${isArabic ? currentTone?.labelAr || tone : currentTone?.labelEn || tone}
      </span>
    </div>
  </div>

  <div class="section-title">
    <span>📝</span>
    <span>${isArabic ? "النص الأصلي (المصدر)" : "Original Text (Source)"}</span>
  </div>
  <div class="text-card source-text">
    ${sourceText.replace(/\n/g, "<br>")}
  </div>

  <div class="section-title" style="color: #4f46e5; border-bottom: 1px solid #e0e7ff;">
    <span>✨</span>
    <span>${isArabic ? "الترجمة السياقية المعتمدة" : "Certified Context-Aware Translation"}</span>
  </div>
  <div class="text-card translated-text" style="border-color: #c7d2fe; background-color: #fafaff;">
    ${translatedText.replace(/\n/g, "<br>")}
  </div>

  ${linguisticAnalysis ? `
  <div class="section-title" style="color: #6b21a8;">
    <span>🔍</span>
    <span>${isArabic ? "التحليل الصوتي والتبصر اللغوي" : "Linguistic Analysis & Insights"}</span>
  </div>
  <div class="analysis-container">
    <div class="analysis-text">${linguisticAnalysis}</div>
  </div>
  ` : ""}

  ${glossaryApplied && glossaryApplied.length > 0 ? `
  <div class="applied-glossary">
    <div class="glossary-title">
      <span>📖</span> ${isArabic ? "المصطلحات المطبقة من قاموسك:" : "Applied Glossary Terms:"}
    </div>
    <div class="glossary-list">
      ${glossaryApplied.map(g => `
        <span class="glossary-tag">
          <strong>${g.source}</strong> ➔ ${g.target}
        </span>
      `).join("")}
    </div>
  </div>
  ` : ""}

  <div class="footer">
    ${isArabic 
      ? "تم إصدار هذا التقرير المهني المنسق بواسطة بوابة Tarjuman للترجمة المتخصصة. جميع الحقوق محفوظة لعام 2026." 
      : "This certified translation report was compiled and formatted by Tarjuman Translation Engine. All rights reserved."}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Export translation directly to a formatted Word document (Microsoft Word compatible)
  const handleExportWord = () => {
    if (!translatedText || !fileAttached) return;
    
    const originalName = fileAttached.name;
    const dotIndex = originalName.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const translatedFileName = `${baseName}_translated_${targetLang}.doc`;

    const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${translatedFileName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>90</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      margin: 40px;
      direction: ${targetLang === "ar" || targetLang === "ur" ? "rtl" : "ltr"};
      text-align: ${targetLang === "ar" || targetLang === "ur" ? "right" : "left"};
    }
    p {
      margin-bottom: 12px;
      font-size: 14px;
      color: #334155;
    }
  </style>
</head>
<body>
  ${translatedText.split("\n").map(p => p.trim() ? `<p>${p}</p>` : "<p>&nbsp;</p>").join("")}
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = translatedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save glossary helper
  const saveGlossaryToStorage = (newGlossary: GlossaryTerm[]) => {
    setGlossary(newGlossary);
    localStorage.setItem("tarjuman_glossary", JSON.stringify(newGlossary));
  };

  // Add Glossary Term
  const handleAddGlossaryTerm = (source: string, target: string) => {
    const newTerm: GlossaryTerm = {
      id: Date.now().toString(),
      source,
      target,
    };
    saveGlossaryToStorage([...glossary, newTerm]);
  };

  // Delete Glossary Term
  const handleDeleteGlossaryTerm = (id: string) => {
    saveGlossaryToStorage(glossary.filter((t) => t.id !== id));
  };

  // Swap Source and Target Languages
  const handleSwapLanguages = () => {
    if (sourceLang === "auto") {
      setSourceLang("en");
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }
    // Swap texts
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  // Dictation/Speech recognition
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        isArabic
          ? "ميزة إدخال الصوت غير مدعومة في متصفحك حالياً"
          : "Voice dictation is not supported in your browser."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Configure language based on source selection
      const langMap: Record<string, string> = {
        ar: "ar-EG",
        en: "en-US",
        fr: "fr-FR",
        es: "es-ES",
        de: "de-DE",
        it: "it-IT",
        tr: "tr-TR"
      };
      recognitionRef.current.lang = langMap[sourceLang] || (isArabic ? "ar-EG" : "en-US");
      recognitionRef.current.start();
    }
  };

  // Call Translate API
  const handleTranslate = async (
    overrideText?: string,
    overrideFile?: FileData | null,
    options: { mode?: "manual" | "auto" } = {}
  ) => {
    const mode = options.mode || "manual";
    const textToTranslate = overrideText !== undefined ? overrideText : sourceText;
    const fileToTranslate = overrideFile !== undefined ? overrideFile : fileAttached;

    if (!textToTranslate.trim() && !fileToTranslate) {
      setError(
        isArabic
          ? "الرجاء كتابة نص للترجمة أو رفع ملف مرفق"
          : "Please write some text or attach a file to translate."
      );
      return;
    }

    // Word count calculation
    const wordCount = 
      (textToTranslate.trim().split(/\s+/).filter(Boolean).length) || 
      (fileToTranslate?.extractedText && fileToTranslate.extractedText !== "Scanned Document (AI Vision/OCR Translation Mode)" 
        ? fileToTranslate.extractedText.trim().split(/\s+/).filter(Boolean).length 
        : 0) || 
      500; // Fallback to 500 words for scanned/multimodal document translation

    // Quota and Auth Gates
    if (currentUser) {
      if (!openSourceMode && currentUser.quotaUsed + wordCount > currentUser.quotaLimit) {
        setError(
          isArabic
            ? "لقد استنفدت الحصة المتاحة لحسابك هذا الشهر. يرجى ترقية باقتك للاستمرار بالترجمة الفورية."
            : "You have exceeded your account's word limit for this month. Please upgrade your plan to continue translating."
        );
        setShowPricingModal(true);
        return;
      }
    } else {
      // Unauthenticated check - allow max 3 translations
      const unauthCountStr = localStorage.getItem("tarjuman_unauth_translations") || "0";
      const unauthCount = parseInt(unauthCountStr, 10);
      if (unauthCount >= 3) {
        setError(
          isArabic
            ? "لقد استنفدت الترجمات المجانية التجريبية. يرجى تسجيل الدخول مجاناً للحصول على 5,000 كلمة إضافية فوراً."
            : "You have used all trial translations. Please sign in or register for free to get 5,000 words instantly."
        );
        setShowAuthModal(true);
        return;
      }
    }

    setIsTranslating(true);
    setError("");
    setRetryStatus(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Client-side retry: Gemini free-tier frequently returns 503/429
    // ("AI is under pressure") when the request rate is too high. Instead
    // of failing immediately, retry with exponential backoff and a
    // visible status so the user knows it's auto-recovering.
    const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
    const MAX_CLIENT_RETRIES = 3;
    const RETRY_DELAYS_MS = [2500, 5000, 10000]; // exponential-ish backoff

    const payload = {
      text: textToTranslate,
      sourceLang,
      targetLang,
      domain,
      tone,
      glossary: glossary.map((g) => ({ source: g.source, target: g.target })),
      file: fileToTranslate,
    };

    try {
      let res: Response | null = null;
      let data: any = null;
      let lastError: string | null = null;

      for (let attempt = 0; attempt <= MAX_CLIENT_RETRIES; attempt++) {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (attempt > 0) {
          const waitMs = RETRY_DELAYS_MS[attempt - 1] || 10000;
          setRetryStatus({
            attempt,
            max: MAX_CLIENT_RETRIES,
            waitMs,
            reason: lastError || "transient",
          });
          try {
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(resolve, waitMs);
              controller.signal.addEventListener("abort", () => {
                clearTimeout(timeout);
                reject(new DOMException("Aborted", "AbortError"));
              });
            });
          } catch (e) {
            throw e;
          }
        }

        res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => ({}));

        if (res.ok && !data.error) {
          break; // success
        }

        const isTransient = TRANSIENT_STATUSES.has(res.status) ||
          (typeof data?.error === "string" &&
            (/UNAVAILABLE|TEMPORARY|BUSY|OVERLOAD|QUOTA|EXHAUST|503|429|ضغط/i.test(data.error)));
        if (!isTransient) {
          // Non-transient — fail fast.
          throw new Error(data?.error || "An error occurred during translation");
        }
        lastError = data?.error || `HTTP ${res.status}`;
        if (attempt === MAX_CLIENT_RETRIES) {
          throw new Error(lastError);
        }
        // else: loop will wait + retry
      }

      if (!res || !res.ok || data?.error) {
        throw new Error(data?.error || "An error occurred during translation");
      }

      setTranslatedText(data.translatedText);
      setDetectedLang(data.detectedLang || "");
      setDetectionConfidence(data.detectionConfidence);
      setAlternativeLanguages(data.alternativeLanguages || []);
      setLinguisticAnalysis(data.linguisticAnalysis || "");
      setAlternatives(data.alternatives || []);
      setGlossaryApplied(data.glossaryApplied || []);

      // Update Quotas
      if (currentUser) {
        const updatedUser: User = {
          ...currentUser,
          quotaUsed: currentUser.quotaUsed + wordCount,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("tarjuman_current_user", JSON.stringify(updatedUser));
      } else {
        const unauthCountStr = localStorage.getItem("tarjuman_unauth_translations") || "0";
        const newCount = parseInt(unauthCountStr, 10) + 1;
        localStorage.setItem("tarjuman_unauth_translations", newCount.toString());
      }

      // Add to History
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        sourceText: textToTranslate,
        translatedText: data.translatedText,
        sourceLang: sourceLang === "auto" ? (data.detectedLang as LanguageCode) || "auto" : sourceLang,
        targetLang,
        domain,
        tone,
        isFavorite: false,
        fileAttached: fileToTranslate
          ? { name: fileToTranslate.name, mimeType: fileToTranslate.mimeType }
          : undefined,
        analysis: data.linguisticAnalysis,
        alternatives: data.alternatives,
        detectionConfidence: data.detectionConfidence,
        alternativeLanguages: data.alternativeLanguages,
      };

      saveHistoryToStorage([historyItem, ...history]);

    } catch (err: any) {
      if (err.name === "AbortError") {
        // Auto-translate cancellations (because the user kept typing) are
        // silent — only the explicit-manual cancellation shows a banner.
        if (mode === "manual") {
          setError(isArabic ? "تم إلغاء عملية الترجمة." : "Translation process was cancelled.");
        }
      } else {
        console.error(err);
        if (mode === "manual") {
          setError(err.message || "Failed to contact translation service.");
        } else {
          // Auto-translate errors stay quiet — log only.
          console.warn("[auto-translate] silent failure:", err?.message);
        }
      }
    } finally {
      setIsTranslating(false);
      setRetryStatus(null);
      abortControllerRef.current = null;
    }
  };

  // Abort ongoing translation request
  const handleCancelTranslation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Clipboard copy helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Play Speech (TTS)
  const handlePlayTTS = async (textToSpeak: string, language: string) => {
    if (!textToSpeak.trim()) return;

    if (isTtsPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsTtsPlaying(false);
      return;
    }

    setIsTtsPlaying(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, lang: language }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Speech synthesis failed");
      }

      // Play advanced Gemini synthesized voice
      const audioUrl = `data:audio/wav;base64,${data.audio}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsTtsPlaying(false);
      };

      audio.onerror = () => {
        throw new Error("Failed playing synth voice. Falling back to browser Synthesis.");
      };

      await audio.play();

    } catch (err) {
      console.warn("Gemini TTS failed, falling back to WebSpeechSynthesis API", err);

      // Graceful fallback to browser speechSynthesis API
      const synth = window.speechSynthesis;
      if (synth) {
        synth.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // Best effort language pairing
        utterance.lang = language === "ar" ? "ar-SA" : (language === "es" ? "es-ES" : (language === "fr" ? "fr-FR" : "en-US"));

        utterance.onend = () => {
          setIsTtsPlaying(false);
        };

        utterance.onerror = () => {
          setIsTtsPlaying(false);
        };

        synth.speak(utterance);
      } else {
        setIsTtsPlaying(false);
        alert(isArabic ? "ميزة قراءة النصوص غير متوفرة في متصفحك" : "Web Speech is not supported in this browser.");
      }
    }
  };

  // Sidebar controls
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setDomain(item.domain);
    setTone(item.tone);
    setLinguisticAnalysis(item.analysis || "");
    setAlternatives(item.alternatives || []);
    setFileAttached(null);
    setShowHistorySidebar(false);
  };

  const handleToggleFavoriteHistory = (id: string) => {
    const updated = history.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    saveHistoryToStorage(updated);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistoryToStorage(updated);
  };

  const handleClearHistory = () => {
    if (confirm(isArabic ? "هل أنت متأكد من مسح تاريخ العمليات بالكامل؟" : "Are you sure you want to clear your entire history?")) {
      saveHistoryToStorage([]);
    }
  };

  // Sample injector
  const injectSample = (lang: string) => {
    const sample = SAMPLE_TEXTS[lang];
    if (sample) {
      setSourceText(sample);
      setSourceLang(lang as LanguageCode);
    }
  };

  const getDomainIcon = (iconName: string) => {
    const mapping: Record<string, any> = {
      MessageSquare: <MessageSquare className="w-4 h-4" />,
      Briefcase: <Briefcase className="w-4 h-4" />,
      TrendingUp: <TrendingUp className="w-4 h-4" />,
      FileText: <FileText className="w-4 h-4" />,
      Heart: <Heart className="w-4 h-4" />,
      Cpu: <Cpu className="w-4 h-4" />,
      GraduationCap: <GraduationCap className="w-4 h-4" />,
      PenTool: <PenTool className="w-4 h-4" />,
      Sprout: <Sprout className="w-4 h-4" />
    };
    return mapping[iconName] || <MessageSquare className="w-4 h-4" />;
  };

  if (maintenanceMode) {
    return (
      <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">🛠️</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">
            {isArabic ? "وضع الصيانة" : "Under Maintenance"}
          </h1>
          <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
            {maintenanceMessage || (isArabic 
              ? "نقوم ببعض التحديثات التقنية الآن. يرجى المحاولة بعد قليل." 
              : "We are currently performing some technical updates. Please check back soon.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-indigo-500 selection:text-white"
    >
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-600/10 flex items-center justify-center bg-slate-50 border border-slate-100">
              <img src="/logo.png" alt="Tarjuman AI Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{isArabic ? "تَرْجُمَان" : "Tarjuman"}</span>
                {!isArabic && (
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {isArabic
                  ? "مترجم احترافي فائق الذكاء بمستويات وخلفيات علمية متخصصة"
                  : "Supercharged domain-specific neural translation machine"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Feedback & Rate us button */}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 sm:px-3 sm:py-2 text-amber-600 hover:bg-amber-50 border border-amber-100 rounded-xl transition-all shadow-sm bg-white cursor-pointer"
            >
              <span className="text-amber-500">★</span>
              <span className="hidden xs:inline">{isArabic ? "قيمنا" : "Rate us"}</span>
            </button>

            {/* Pricing list button — switches to FREE badge when admin has enabled open-source mode */}
            {openSourceMode ? (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold px-2 py-1.5 sm:px-3 sm:py-2 text-white bg-emerald-600 border border-emerald-700 rounded-xl shadow-sm cursor-default">
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{isArabic ? "مجاني بالكامل" : "FREE FOR ALL"}</span>
              </span>
            ) : (
              <button
                onClick={() => setShowPricingModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 sm:px-3 sm:py-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all shadow-sm bg-white cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{isArabic ? "الأسعار" : "Pricing"}</span>
              </button>
            )}

            {/* Language interface toggle */}
            <button
              onClick={() => setUiLang(isArabic ? "en" : "ar")}
              className="text-xs font-semibold px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm bg-white cursor-pointer"
            >
              <span className="xs:hidden">{isArabic ? "EN" : "AR"}</span>
              <span className="hidden xs:inline">{isArabic ? "English" : "العربية"}</span>
            </button>

            {/* History drawer button */}
            <button
              onClick={() => setShowHistorySidebar(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 sm:px-3.5 sm:py-2 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:bg-indigo-50/30 rounded-xl transition-all shadow-sm bg-white cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "السجل" : "History"}</span>
            </button>

            {/* Authentication Gateway Dropdown Widget */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-1.5 p-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all bg-white relative cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate hidden sm:inline">
                    {currentUser.name}
                  </span>
                  {currentUser.plan !== "free" && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProfileDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute mt-2 ${
                          isArabic ? "left-0" : "right-0"
                        } w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden p-4 space-y-4`}
                      >
                        {/* Dropdown Header Info */}
                        <div className="space-y-1 pb-3 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                          <div className="pt-2 flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                currentUser.plan === "enterprise"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : currentUser.plan === "pro"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {currentUser.plan === "enterprise"
                                ? isArabic
                                  ? "الشركات Enterprise"
                                  : "Enterprise"
                                : currentUser.plan === "pro"
                                ? isArabic
                                  ? "الاحترافية Pro"
                                  : "Pro"
                                : isArabic
                                ? "المجانية"
                                : "Free"}
                            </span>
                          </div>
                        </div>

                        {/* Quota Progress widget */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{isArabic ? "رصيد الكلمات المستخدم" : "Used Quota"}</span>
                            <span>
                              {currentUser.quotaLimit > 1000000
                                ? "∞"
                                : `${currentUser.quotaUsed} / ${currentUser.quotaLimit}`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (currentUser.quotaUsed / currentUser.quotaLimit) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Dropdown Options */}
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                          {currentUser?.role === "super_admin" && (
                            <button
                              onClick={() => {
                                window.location.href = "/admin";
                              }}
                              className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{isArabic ? "لوحة التحكم للمدير" : "Admin Panel"}</span>
                            </button>
                          )}
                          {!openSourceMode && (
                            <button
                              onClick={() => {
                                setShowPricingModal(true);
                                setShowProfileDropdown(false);
                              }}
                              className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isArabic ? "ترقية الباقة والمميزات" : "Upgrade Plan"}</span>
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>{isArabic ? "تسجيل الخروج" : "Logout"}</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{isArabic ? "تسجيل الدخول" : "Sign In"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AdBanner />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* API Key / Setup Warnings */}
        {error && error.includes("GEMINI_API_KEY") && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex gap-3 items-start max-w-3xl mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                {isArabic ? "مفتاح API لـ Gemini غير متاح" : "Gemini API Key Missing"}
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                {isArabic
                  ? "يتطلب تفعيل هذا المترجم المتقدم تعيين مفتاح API الخاص بـ Gemini. يرجى الذهاب إلى قائمة 'Settings > Secrets' في لوحة استوديو الذكاء الاصطناعي وإضافته لتشغيل الأداة بنجاح."
                  : "To activate high-fidelity translation, you need to configure your GEMINI_API_KEY. Please set it via the Secrets panel in the AI Studio settings menu."}
              </p>
            </div>
          </div>
        )}

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Translator Panel (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Lang Swapper Row */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Source Lang dropdown */}
              <div className="w-full sm:w-auto flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">{isArabic ? "من:" : "From:"}</span>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value as LanguageCode)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer text-slate-800"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {isArabic ? lang.nativeName : lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swapper button */}
              <button
                type="button"
                onClick={handleSwapLanguages}
                disabled={sourceLang === "auto"}
                className={`p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-indigo-600 transition-all ${
                  sourceLang === "auto" ? "opacity-40 cursor-not-allowed" : "active:scale-95"
                }`}
                title={isArabic ? "تبديل اللغات" : "Swap Languages"}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              {/* Target Lang dropdown */}
              <div className="w-full sm:w-auto flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">{isArabic ? "إلى:" : "To:"}</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer text-slate-800"
                >
                  {LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {isArabic ? lang.nativeName : lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specialized Domain and Tone Pickers */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Domain Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {isArabic ? "المجال التخصصي للترجمة" : "Specialized Domain Focus"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-indigo-600">
                      {getDomainIcon(DOMAINS.find((d) => d.code === domain)?.icon || "MessageSquare")}
                    </div>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value as DomainCode)}
                      className={`w-full bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-sm font-semibold rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer text-slate-800 appearance-none ${
                        isArabic ? "pr-3.5 pl-10 text-right" : "pl-11 pr-3.5 text-left"
                      }`}
                    >
                      {DOMAINS.map((dom) => (
                        <option key={dom.code} value={dom.code}>
                          {isArabic ? dom.labelAr : dom.labelEn}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500/90 leading-relaxed pl-1">
                    {isArabic
                      ? DOMAINS.find((d) => d.code === domain)?.descAr
                      : DOMAINS.find((d) => d.code === domain)?.descEn}
                  </p>
                </div>

                {/* Tone Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {isArabic ? "النبرة والأسلوب اللغوي" : "Stylistic Tone"}
                  </label>
                  <div className="relative">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as ToneCode)}
                      className={`w-full bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-sm font-semibold rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer text-slate-800 appearance-none ${
                        isArabic ? "pr-3.5 pl-10 text-right" : "pl-3.5 pr-10 text-left"
                      }`}
                    >
                      {TONES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {isArabic ? t.labelAr : t.labelEn}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500/90 leading-relaxed pl-1">
                    {isArabic
                      ? TONES.find((t) => t.code === tone)?.descAr
                      : TONES.find((t) => t.code === tone)?.descEn}
                  </p>
                </div>
              </div>
            </div>

            {/* Translation Workspace Core */}
            <div className="flex flex-col gap-4">
              {/* Source Text Side */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col min-h-[260px]">
                {/* Meta Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-xs font-semibold text-slate-700">
                      {sourceLang === "auto"
                        ? isArabic
                          ? "كشف اللغة تلقائياً"
                          : "Auto Detect Mode"
                        : isArabic
                        ? `نص بـ ${LANGUAGES.find((l) => l.code === sourceLang)?.nativeName}`
                        : `Source in ${LANGUAGES.find((l) => l.code === sourceLang)?.name}`}
                    </span>
                  </div>

                  {/* Sample texts injector */}
                  {sourceText.trim() === "" && !fileAttached && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => injectSample("ar")}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 py-1 px-2 rounded-lg font-medium transition-colors"
                      >
                        {isArabic ? "عينة عربي" : "AR Sample"}
                      </button>
                      <button
                        onClick={() => injectSample("en")}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 py-1 px-2 rounded-lg font-medium transition-colors"
                      >
                        {isArabic ? "عينة إنجليزي" : "EN Sample"}
                      </button>
                    </div>
                  )}

                  {sourceText.trim() !== "" && (
                    <button
                      onClick={() => {
                        setSourceText("");
                        setFileAttached(null);
                        setTranslatedText("");
                        setLinguisticAnalysis("");
                        setAlternatives([]);
                      }}
                      className="text-[10px] text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors font-medium"
                    >
                      {isArabic ? "مسح النص" : "Clear Text"}
                    </button>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex-1 flex flex-col gap-2">
                  {/* Source label */}
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      <PencilLine className="w-3 h-3" />
                      {isArabic ? "المصدر" : "SOURCE"}
                    </span>
                    {autoTranslate && currentUser && !fileAttached && !isTranslating && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        {isArabic ? "فوري" : "AUTO"}
                      </span>
                    )}
                    {autoTranslating && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        {isArabic ? "جاري الترجمة..." : "Translating..."}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isArabic ? "النص الأصلي للترجمة" : "Original text to translate"}
                    </span>
                  </div>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={
                      isArabic
                        ? "اكتب النص المراد ترجمته هنا، أو استخدم الميكروفون للإملاء الصوتي..."
                        : "Type your text here, or use the microphone to dictate..."
                    }
                    className="w-full flex-1 min-h-[120px] bg-slate-50 p-3.5 ps-5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 text-slate-900 text-sm leading-relaxed resize-none placeholder-slate-400 border-s-4 border-s-slate-400 relative"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: "#64748b", // slate-500
                      fontFeatureSettings: "'liga' 1, 'calt' 1",
                    }}
                    dir="auto"
                  />

                  {/* Real-time word count & quota feedback panel */}
                  <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-slate-600 font-medium">
                      {isArabic ? "حجم النص الحالي:" : "Current Input Size:"}{" "}
                      <span className="font-bold text-indigo-700">{sourceText.length}</span> {isArabic ? "حرف" : "chars"} •{" "}
                      <span className="font-bold text-indigo-700">{sourceText.trim().split(/\s+/).filter(Boolean).length}</span> {isArabic ? "كلمة" : "words"}
                    </div>
                    <div className="text-xs text-indigo-800 font-bold flex items-center gap-1">
                      <span>{isArabic ? "الحصة المتبقية:" : "Remaining Quota:"}</span>
                      <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-md font-mono text-[11px]">
                        {currentUser ? (
                          currentUser.quotaLimit > 1000000 
                            ? "∞" 
                            : `${Math.max(0, currentUser.quotaLimit - currentUser.quotaUsed)} ${isArabic ? "كلمة" : "words"}`
                        ) : (
                          `${Math.max(0, 3 - parseInt(localStorage.getItem("tarjuman_unauth_translations") || "0", 10))} ${isArabic ? "ترجمات متبقية" : "runs left"}`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* File Uploader integration */}
                  <FileTranslator
                    selectedFile={fileAttached}
                    onFileLoaded={(file) => {
                      setFileAttached(file);
                      if (file) {
                        if (!sourceText.trim() || (sourceText.startsWith("[") && sourceText.endsWith("]"))) {
                          // Place a placeholder note
                          setSourceText(
                            isArabic
                              ? `[جاري ترجمة مستند مرفق: ${file.name}]`
                              : `[Translating attached file: ${file.name}]`
                          );
                        }
                      } else {
                        // Reset all translation states when file is removed
                        setSourceText("");
                        setTranslatedText("");
                        setLinguisticAnalysis("");
                        setAlternatives([]);
                        setGlossaryApplied([]);
                        setDetectedLang("");
                        setDetectionConfidence(undefined);
                        setAlternativeLanguages([]);
                      }
                    }}
                    isArabic={isArabic}
                  />
                </div>

                {/* Controls Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleListening}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isListening
                          ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      title={isArabic ? "إملاء صوتي" : "Speech Dictation"}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {sourceText.trim().length} {isArabic ? "حرف" : "chars"} •{" "}
                    {sourceText.trim().split(/\s+/).filter(Boolean).length} {isArabic ? "كلمة" : "words"}
                  </div>
                </div>
              </div>

              {/* Target Text Side */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col min-h-[260px]">
                {/* Meta Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-slate-700">
                      {isArabic
                        ? `الترجمة بـ ${LANGUAGES.find((l) => l.code === targetLang)?.nativeName}`
                        : `Translation in ${LANGUAGES.find((l) => l.code === targetLang)?.name}`}
                    </span>
                  </div>

                  {detectedLang && sourceLang === "auto" && (
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50 px-2.5 py-0.5 rounded-full">
                      {isArabic ? "اللغة المكتشفة:" : "Detected:"}{" "}
                      {LANGUAGES.find((l) => l.code === detectedLang)?.flag || "🌐"}{" "}
                      {isArabic
                        ? LANGUAGES.find((l) => l.code === detectedLang)?.nativeName || detectedLang
                        : LANGUAGES.find((l) => l.code === detectedLang)?.name || detectedLang}
                    </span>
                  )}
                </div>

                {/* Expanded language detection confidence & alternative suggestions widget */}
                {detectedLang && sourceLang === "auto" && (
                  <div className="mb-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span>{isArabic ? "دقة الكشف التلقائي:" : "Detection Confidence:"}</span>
                        {detectionConfidence !== undefined ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border ${
                              detectionConfidence >= 0.85
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : detectionConfidence >= 0.60
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {Math.round(detectionConfidence * 100)}%{" "}
                            {detectionConfidence >= 0.85
                              ? isArabic
                                ? "(عالية)"
                                : "(High)"
                              : detectionConfidence >= 0.60
                              ? isArabic
                                ? "(متوسطة)"
                                : "(Medium)"
                              : isArabic
                              ? "(منخفضة)"
                              : "(Low)"}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">--</span>
                        )}
                      </div>

                      {/* Small visual explanation or note */}
                      <span className="text-[10px] text-slate-400">
                        {isArabic
                          ? "محلل من نظام Tarjuman الذكي"
                          : "Analyzed by Tarjuman Smart Engine"}
                      </span>
                    </div>

                    {/* Show alternative suggestions if confidence is lower than 0.85 */}
                    {alternativeLanguages && alternativeLanguages.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/50 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">
                          {isArabic ? "اقتراحات بديلة للغة المصدر:" : "Alternative Language Suggestions:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {alternativeLanguages.map((langStr, idx) => {
                            const resolved = resolveLanguage(langStr);
                            if (!resolved) {
                              return (
                                <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-600">
                                  {langStr}
                                </span>
                              );
                            }
                            return (
                              <button
                                key={resolved.code}
                                type="button"
                                onClick={() => {
                                  setSourceLang(resolved.code);
                                }}
                                className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 text-[10px] font-bold py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                                title={isArabic ? `التبديل إلى ${resolved.nativeName}` : `Switch to ${resolved.name}`}
                              >
                                <span>{resolved.flag}</span>
                                <span>{isArabic ? resolved.nativeName : resolved.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Output Area */}
                <div
                  className="flex-1 bg-emerald-50/50 p-4 border border-emerald-200 rounded-xl relative flex flex-col justify-between"
                  style={{ borderRightWidth: "4px", borderRightColor: "#10b981" }}
                >
                  {/* Target label */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Check className="w-3 h-3" />
                      {isArabic ? "الترجمة" : "TRANSLATION"}
                    </span>
                    <span className="text-[10px] text-emerald-700/80 font-medium">
                      {isArabic ? "النص المترجم" : "Translated output"}
                    </span>
                  </div>
                  {isTranslating ? (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-xl z-10">
                      <div className="relative">
                        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                        <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 animate-pulse">
                        {isArabic ? "جاري الترجمة بذكاء واحترافية..." : "Translating with domain mastery..."}
                      </p>
                      {retryStatus && (
                        <p className="text-[10px] text-amber-700 font-bold mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-block">
                          {isArabic
                            ? `إعادة محاولة تلقائية ${retryStatus.attempt}/${retryStatus.max} خلال ${Math.ceil(retryStatus.waitMs / 1000)} ثانية... (ضغط مؤقت على Gemini)`
                            : `Auto-retrying ${retryStatus.attempt}/${retryStatus.max} in ${Math.ceil(retryStatus.waitMs / 1000)}s… (transient Gemini pressure)`}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="flex-1 text-sm text-emerald-950 leading-relaxed overflow-y-auto min-h-[120px] whitespace-pre-wrap">
                    {translatedText ? (
                      <TypewriterTranslation text={translatedText} />
                    ) : (
                      <span className="text-emerald-700/60 italic">
                        {isArabic
                          ? "ستظهر الترجمة الصياغية المحكمة هنا بعد كتابة النص والنقر على زر الترجمة..."
                          : "Your cohesive context-aware translation will appear here..."}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preserved layout file download widget */}
                {fileAttached && translatedText && (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg flex-shrink-0">
                        <FileDown className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-indigo-950 leading-tight">
                          {isArabic ? "تحميل المستند المترجم بالتنسيقات" : "Download Formatted File"}
                        </p>
                        <p className="text-[8px] text-indigo-700/80 font-medium truncate max-w-[150px] sm:max-w-[250px]">
                          {fileAttached.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handleDownloadTranslatedFile}
                        className="flex-shrink-0 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-all cursor-pointer"
                        title={isArabic ? "تحميل بصيغة HTML التفاعلية" : "Download as Interactive HTML"}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isArabic ? "ملف HTML" : "HTML File"}</span>
                      </button>
                      
                      {fileAttached.name.toLowerCase().endsWith(".docx") && (
                        <button
                          type="button"
                          onClick={handleExportWord}
                          className="flex-shrink-0 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-all cursor-pointer"
                          title={isArabic ? "تحميل كمستند Word منسق" : "Download as Formatted Word Document"}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isArabic ? "ملف Word" : "Word File"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="flex-shrink-0 flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                        title={isArabic ? "تصدير كتقرير PDF رسمي" : "Export as Certified PDF"}
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>{isArabic ? "تصدير PDF" : "Export PDF"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Controls Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!translatedText}
                      onClick={() => handleCopyToClipboard(translatedText)}
                      className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">{isArabic ? "تم النسخ" : "Copied"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isArabic ? "نسخ" : "Copy"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!translatedText}
                      onClick={() => handlePlayTTS(translatedText, targetLang)}
                      className={`p-2 border rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                        isTtsPlaying
                          ? "bg-amber-500 border-amber-500 text-white animate-pulse"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                      title={isArabic ? "قراءة الترجمة" : "Speak Translation"}
                    >
                      {isTtsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isTtsPlaying ? (isArabic ? "إيقاف" : "Stop") : (isArabic ? "نطق" : "Speak")}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!translatedText}
                      onClick={handleExportPDF}
                      className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      title={isArabic ? "تصدير كتقرير PDF رسمي" : "Export to Certified PDF Report"}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{isArabic ? "تصدير PDF" : "Export PDF"}</span>
                    </button>
                  </div>

                  {isTranslating ? (
                    <button
                      onClick={handleCancelTranslation}
                      className="flex items-center gap-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-95 cursor-pointer border-0"
                    >
                      <X className="w-4 h-4" />
                      <span>{isArabic ? "إيقاف الترجمة" : "Stop"}</span>
                    </button>
                  ) : (
                    <>
                      {/* Auto-translate toggle (only for signed-in users; file translation
                          is always explicit) */}
                      {currentUser && !fileAttached && (
                        <button
                          onClick={() => setAutoTranslate((v) => !v)}
                          title={
                            autoTranslate
                              ? isArabic
                                ? "الترجمة الفورية مفعّلة — اضغط لإيقافها"
                                : "Auto-translate is ON — click to disable"
                              : isArabic
                                ? "الترجمة الفورية معطّلة — اضغط لتفعيلها"
                                : "Auto-translate is OFF — click to enable"
                          }
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-2 rounded-xl transition-all border ${
                            autoTranslate
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Zap className={`w-3.5 h-3.5 ${autoTranslate ? "fill-current" : ""}`} />
                          <span className="hidden sm:inline">
                            {isArabic ? "فوري" : "Auto"}
                          </span>
                          <span
                            className={`relative w-7 h-3.5 rounded-full transition-colors ${
                              autoTranslate ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                                autoTranslate ? "translate-x-3.5" : "translate-x-0.5"
                              }`}
                            />
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => handleTranslate()}
                        disabled={!sourceText.trim() && !fileAttached}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 cursor-pointer border-0"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>{isArabic ? "ترجم الآن" : "Translate"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Alternatives & Variations */}
            {alternatives && alternatives.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-sm">
                    {isArabic ? "خيارات صياغة بديلة" : "Alternative Phrasings / Styles"}
                  </h4>
                </div>
                <div className="space-y-2">
                  {alternatives.map((alt, i) => (
                    <div
                      key={i}
                      onClick={() => setTranslatedText(alt)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer text-xs text-slate-700 flex justify-between items-center group"
                      title={isArabic ? "اعتماد هذه الصياغة" : "Adopt this phrasing"}
                    >
                      <p className="font-medium flex-1 pr-4">{alt}</p>
                      <span className="text-[10px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isArabic ? "تطبيق ↩" : "Apply ↩"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Glossary Terminology Manager */}
            <GlossaryManager
              terms={glossary}
              onAddTerm={handleAddGlossaryTerm}
              onDeleteTerm={handleDeleteGlossaryTerm}
              isArabic={isArabic}
            />

            {/* Smart Linguistic Insights Helper Panel */}
            {translatedText && linguisticAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-900 to-slate-900 text-slate-100 rounded-2xl p-5 shadow-lg border border-slate-800 space-y-3"
              >
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-300 rounded-lg">
                    <BookOpenCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {isArabic ? "مساعد ترجمان اللغوي" : "Linguistic Insights Assistant"}
                    </h4>
                    <p className="text-[10px] text-indigo-300 font-medium">
                      {isArabic ? "تحليل الصياغة وبلاغة التراكيب" : "Socio-cultural and syntactic analysis"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  <p className="whitespace-pre-line font-medium">{linguisticAnalysis}</p>
                </div>

                {glossaryApplied.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                      {isArabic ? "مصطلحات مطبقة من قاموسك:" : "Custom glossary terms applied:"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {glossaryApplied.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium"
                        >
                          {item.source} → {item.target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quick Tips Box */}
            <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed space-y-2">
              <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>{isArabic ? "ميزات احترافية إضافية" : "Expert Productivity Tips"}</span>
              </h5>
              <ul className="list-disc list-inside space-y-1.5 pr-1">
                <li>
                  {isArabic
                    ? "اختر مجالات تخصصية مثل العقود القانونية أو التقارير المالية لفرض الدقة المصطلحية المناسبة للمجال."
                    : "Select specialised domains like legal or finance to inject domain-specific phraseologies."}
                </li>
                <li>
                  {isArabic
                    ? "عند تعيين اللغة لـ 'كشف تلقائي'، سيكتشف المترجم اللغة الأصلية ويعرضها لك."
                    : "Use 'Auto Detect' to translate texts with unknown origin. Language code will appear."}
                </li>
                <li>
                  {isArabic
                    ? "أضف أسماء منتجاتك أو مصطلحات شركتك لقاموس المصطلحات لتبقى ثابتة دون تعديل."
                    : "Add business-specific branding terms in the Glossary to keep brand names intact."}
                </li>
              </ul>
            </div>

            {/* User Translation Rating & Feedback Card */}
            {translatedText && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-right"
                dir="rtl"
              >
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">
                      {isArabic ? "ما تقييمك لجودة الترجمة؟" : "Rate Translation Quality"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isArabic ? "ملاحظاتك تساعدنا في تطوير محرك الذكاء الاصطناعي" : "Your feedback optimizes our neural translation models"}
                    </p>
                  </div>
                </div>

                {feedbackSubmitted ? (
                  <div className="text-center py-4 space-y-2 animate-in fade-in duration-300">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Check className="w-5 h-5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">
                      {isArabic ? "نشكرك على مشاركتنا رأيك!" : "Thank you for your rating!"}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {isArabic ? "تم تسجيل تقييمك وملاحظاتك بنجاح في النظام." : "Your review has been successfully stored in our database."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    {/* Stars row */}
                    <div className="flex items-center justify-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isStarred = hoveredRating ? star <= hoveredRating : (userRating ? star <= userRating : false);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="text-2xl transition-all duration-150 transform hover:scale-125 cursor-pointer focus:outline-none bg-transparent border-0"
                          >
                            <span className={isStarred ? "text-amber-400" : "text-slate-200"}>★</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Text area */}
                    <div className="space-y-1">
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder={isArabic ? "اكتب أي ملاحظات أو مقترحات هنا (اختياري)..." : "Write any suggestions or remarks (optional)..."}
                        className="w-full min-h-[60px] p-2.5 text-[11px] border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!userRating || feedbackLoading}
                      className="w-full bg-slate-900 hover:bg-slate-850 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {feedbackLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>{isArabic ? "إرسال التقييم" : "Submit Review"}</span>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Inline Pricing plans section */}
        {!openSourceMode && (
          <div className="pt-10 border-t border-slate-100/60">
            <PricingTable
              currentUser={currentUser}
              onSubscribe={handleSubscribe}
              isArabic={isArabic}
              loadingPlanId={subscribingPlan}
              provider={billingProvider}
              onProviderChange={setBillingProvider}
            />
          </div>
        )}
      </main>

      {/* Popups and Overlays Modals */}
      <AnimatePresence>
        {/* Auth Gateway Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            isArabic={isArabic}
          />
        )}

        {/* Dynamic overall Feedback Modal */}
        {showFeedbackModal && (
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            isArabic={isArabic}
            userEmail={currentUser?.email}
          />
        )}

        {/* Pop-up Pricing Plans Modal */}
        {showPricingModal && !openSourceMode && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-5xl w-full relative shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setShowPricingModal(false)}
                className="absolute top-5 left-5 p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all z-10 cursor-pointer"
              >
                ✕
              </button>
              <div className="p-2">
                <PricingTable
                  currentUser={currentUser}
                  onSubscribe={handleSubscribe}
                  isArabic={isArabic}
                  loadingPlanId={subscribingPlan}
                  provider={billingProvider}
                  onProviderChange={setBillingProvider}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Upgrade Success Overlay Card */}
        {showUpgradeSuccess && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900">
                  {isArabic ? "تهانينا! تم تفعيل اشتراكك بنجاح" : "Congratulations! Active Premium Subscription"}
                </h4>
                <p className="text-xs text-slate-500">
                  {isArabic
                    ? `أنت الآن مشترك في ${successPlanName}، وتمت زيادة حصة كلماتك وفتح جميع الميزات الاحترافية فورا.`
                    : `You are now on the ${successPlanName}. Your word quota has been upgraded and all pro features unlocked.`}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setShowUpgradeSuccess(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isArabic ? "ابدأ استخدام الميزات" : "Get Started"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sliding History Sidebar drawer */}
      <AnimatePresence>
        {showHistorySidebar && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistorySidebar(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Drawer sheet */}
            <motion.div
              initial={{ x: isArabic ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`fixed top-0 bottom-0 ${
                isArabic ? "left-0 sm:left-auto right-0" : "right-0 sm:right-auto left-0"
              } w-full sm:w-[400px] z-50 p-4 h-full`}
            >
              <div className="h-full relative">
                {/* Close handle button */}
                <button
                  onClick={() => setShowHistorySidebar(false)}
                  className={`absolute top-4 ${
                    isArabic ? "left-4" : "right-4"
                  } p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors z-50`}
                >
                  <Check className="w-5 h-5 hidden" /> {/* Dummy to hold layout */}
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-slate-200">
                    {isArabic ? "إغلاق ✕" : "Close ✕"}
                  </span>
                </button>

                <HistorySidebar
                  history={history}
                  onSelectItem={handleSelectHistoryItem}
                  onToggleFavorite={handleToggleFavoriteHistory}
                  onDeleteItem={handleDeleteHistoryItem}
                  onClearAll={handleClearHistory}
                  isArabic={isArabic}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdBanner />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 {isArabic ? "مترجم ترجمان" : "Tarjuman Translator Pro"}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
