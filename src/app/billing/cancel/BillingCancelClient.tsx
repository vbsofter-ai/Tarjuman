"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { XCircle, ArrowRight, Globe, Unlock } from "lucide-react";

type Lang = "ar" | "en";
type OpenSourceState = { enabled: boolean; message: string } | null;

const T = {
  ar: {
    title: "تم إلغاء عملية الدفع",
    body: "لم يتم خصم أي مبلغ من بطاقتك. إذا واجهت أي مشكلة، لا تتردد في التواصل مع فريق الدعم.",
    backToPlans: "العودة إلى خطط الأسعار",
    backToApp: "متابعة استخدام ترجمان",
    needHelp: "تحتاج مساعدة؟",
    helpBody: "إذا تعذّر إكمال الدفع لأي سبب، تواصل معنا وسنحل المشكلة لك خلال ساعات.",
    openSourceTitle: "ترجمان مجاني بالكامل! 🎉",
    openSourceBody: "ترجمان مفتوح المصدر حالياً — لا حاجة لأي عملية دفع. كل الباقات متاحة للجميع بحصص غير محدودة.",
    openSourceCta: "ابدأ الترجمة الآن",
  },
  en: {
    title: "Payment was cancelled",
    body: "No amount was charged from your card. If you experienced any issue, please reach out to our support team.",
    backToPlans: "Back to pricing plans",
    backToApp: "Continue using Tarjuman",
    needHelp: "Need help?",
    helpBody: "If you could not complete the payment for any reason, contact us and we will resolve it within hours.",
    openSourceTitle: "Tarjuman is free for everyone! 🎉",
    openSourceBody: "Tarjuman is currently in open-source / free mode — no payment is required. All features are unlocked with unlimited quotas.",
    openSourceCta: "Start translating now",
  },
};

export default function BillingCancelClient({ initialOpenSource }: { initialOpenSource: OpenSourceState }) {
  const [lang, setLang] = useState<Lang>("ar");
  // Initial state from server-side render so the banner appears immediately
  const [openSourceState, setOpenSourceState] = useState<OpenSourceState>(initialOpenSource);
  const t = T[lang];
  const isRtl = lang === "ar";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get("lang");
    if (queryLang === "en" || queryLang === "ar") {
      setLang(queryLang);
    } else {
      const stored = window.localStorage.getItem("tarjuman_ui_lang");
      if (stored === "en" || stored === "ar") setLang(stored);
    }
  }, []);

  // Re-fetch on mount to pick up the latest state (server already gave us
  // the initial value)
  useEffect(() => {
    fetch("/api/public/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.openSource) {
          setOpenSourceState({
            enabled: Boolean(d.openSource.enabled),
            message: String(d.openSource.message || ""),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("tarjuman_ui_lang", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    } catch {}
  }, [lang, isRtl]);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-4 ${isRtl ? "font-tajawal" : "font-sans"}`}>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-extrabold text-slate-900">Tarjuman</span>
          </Link>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="text-xs font-bold text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-5">
          {openSourceState?.enabled ? (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <Unlock className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t.openSourceTitle}</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {openSourceState.message || t.openSourceBody}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                >
                  <span>{t.openSourceCta}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">{t.body}</p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                <p className="text-sm font-bold text-slate-800">{t.needHelp}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.helpBody}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
                >
                  {t.backToPlans}
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                >
                  <span>{t.backToApp}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
