"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertTriangle, ArrowRight, Globe, ShieldCheck } from "lucide-react";

type Lang = "ar" | "en";

const T = {
  ar: {
    title: "جاري التحقق من عملية الدفع…",
    subtitlePaymob: "نتحقق الآن من تأكيد بوابة Paymob لتفعيل اشتراكك.",
    subtitlePaypal: "نتحقق الآن من تأكيد بوابة PayPal لتفعيل اشتراكك.",
    successTitle: "تم الدفع بنجاح! 🎉",
    successBody: "تم تفعيل اشتراكك في ترجمان بنجاح. يمكنك العودة إلى التطبيق والبدء بالترجمة فوراً بحصصك الجديدة.",
    pendingTitle: "بانتظار تأكيد بوابة الدفع…",
    pendingBody: "استلمنا طلبك وننتظر تأكيد بوابة الدفع النهائية. عادةً ما يستغرق ذلك أقل من دقيقة.",
    failedTitle: "تعذّر تأكيد الدفع",
    failedBody: "لم نستلم تأكيداً من بوابة الدفع بعد. إذا تم خصم المبلغ من بطاقتك، فسيتم تفعيل اشتراكك تلقائياً خلال دقائق قليلة.",
    retry: "حاول مرة أخرى",
    goApp: "العودة إلى ترجمان",
    goPricing: "عرض خطط الأسعار",
    receipt: "رقم العملية",
    plan: "الباقة",
    newQuota: "حصتك الشهرية الجديدة",
    providerLabel: "بوابة الدفع",
    paymobLabel: "Paymob (جنيه مصري)",
    paypalLabel: "PayPal (دولار أمريكي)",
    paymobSecure: "دفع آمن وموثّق عبر Paymob",
    paypalSecure: "دفع آمن وموثّق عبر PayPal",
  },
  en: {
    title: "Verifying your payment…",
    subtitlePaymob: "We are confirming the payment with Paymob to activate your subscription.",
    subtitlePaypal: "We are confirming the payment with PayPal to activate your subscription.",
    successTitle: "Payment successful! 🎉",
    successBody: "Your Tarjuman subscription is now active. Head back to the app and start translating right away with your new quota.",
    pendingTitle: "Waiting for the gateway confirmation…",
    pendingBody: "We received your request and are waiting for the payment gateway to settle. This usually takes less than a minute.",
    failedTitle: "Could not confirm the payment",
    failedBody: "We did not receive a confirmation yet. If your card was charged, your subscription will be activated automatically within a few minutes.",
    retry: "Try again",
    goApp: "Back to Tarjuman",
    goPricing: "View pricing plans",
    receipt: "Transaction ID",
    plan: "Plan",
    newQuota: "New monthly quota",
    providerLabel: "Payment provider",
    paymobLabel: "Paymob (Egyptian Pound)",
    paypalLabel: "PayPal (US Dollar)",
    paymobSecure: "Secure payments processed by Paymob",
    paypalSecure: "Secure payments processed by PayPal",
  },
};

const QUOTA_LABEL: Record<string, Record<Lang, string>> = {
  free: { ar: "5,000 كلمة", en: "5,000 words" },
  pro: { ar: "100,000 كلمة", en: "100,000 words" },
  enterprise: { ar: "غير محدود", en: "Unlimited" },
};

const PLAN_NAME: Record<string, Record<Lang, string>> = {
  free: { ar: "الباقة المجانية", en: "Free Plan" },
  pro: { ar: "الباقة الاحترافية Pro", en: "Pro Professional" },
  enterprise: { ar: "باقة الشركات", en: "Enterprise Master" },
};

export default function BillingSuccessPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [status, setStatus] = useState<"verifying" | "paid" | "pending" | "failed">("verifying");
  const [payment, setPayment] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [provider, setProvider] = useState<"paymob" | "paypal">("paymob");
  const stopPollingRef = useRef(false);
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

  useEffect(() => {
    try {
      window.localStorage.setItem("tarjuman_ui_lang", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    } catch {}
  }, [lang, isRtl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("payment") || "";
    const providerParam = (params.get("provider") || "").toLowerCase();
    if (providerParam === "paypal" || providerParam === "paymob") {
      setProvider(providerParam);
    }
    // PayPal returns ?token=<paypalOrderId>&PayerID=<...>
    const paypalToken = params.get("token") || "";
    const paypalPayerId = params.get("PayerID") || "";

    if (!paymentId) {
      setStatus("failed");
      return;
    }

    let rawUser: any = null;
    try {
      const raw = window.localStorage.getItem("tarjuman_current_user");
      if (raw) rawUser = JSON.parse(raw);
    } catch {}
    setUser(rawUser);

    const email = rawUser?.email || "";

    // For PayPal we need to call /api/billing/capture-paypal immediately to
    // capture the order (PayPal returns the user before the server-to-server
    // capture is run). Once that succeeds, we then poll status as usual.
    const capturePaypalIfNeeded = async (): Promise<boolean> => {
      if (providerParam !== "paypal" || !paypalToken) return false;
      try {
        setStatus("verifying");
        const res = await fetch("/api/billing/capture-paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId,
            paypalOrderId: paypalToken,
            payerId: paypalPayerId,
          }),
        });
        const data = await res.json();
        if (res.ok && data?.user) {
          try {
            window.localStorage.setItem("tarjuman_current_user", JSON.stringify(data.user));
          } catch {}
          setUser(data.user);
        }
        return res.ok && data?.status === "paid";
      } catch (err) {
        console.error("PayPal capture error:", err);
        return false;
      }
    };

    const poll = async (attempt: number) => {
      if (stopPollingRef.current) return;
      try {
        const res = await fetch(`/api/billing/status?payment=${encodeURIComponent(paymentId)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (res.ok) {
          setPayment(data.payment);
          if (data.payment?.status === "paid") {
            setStatus("paid");
            if (data.user) {
              try {
                window.localStorage.setItem("tarjuman_current_user", JSON.stringify(data.user));
              } catch {}
            }
            stopPollingRef.current = true;
            return;
          }
          if (data.payment?.status === "failed" || data.payment?.status === "cancelled") {
            setStatus("failed");
            stopPollingRef.current = true;
            return;
          }
        }
        if (attempt < 12) {
          setAttempts(attempt + 1);
          setTimeout(() => poll(attempt + 1), 3000);
        } else {
          setStatus("pending");
        }
      } catch (err) {
        if (attempt < 6) {
          setTimeout(() => poll(attempt + 1), 4000);
        } else {
          setStatus("pending");
        }
      }
    };

    (async () => {
      // 1) If this is a PayPal return, capture first.
      const captured = await capturePaypalIfNeeded();
      if (captured) {
        setStatus("paid");
        stopPollingRef.current = true;
        return;
      }
      // 2) Otherwise (Paymob or webhook-not-yet-fired) poll until the
      //    gateway confirms.
      poll(0);
    })();

    return () => {
      stopPollingRef.current = true;
    };
  }, []);

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

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center">
          {status === "verifying" && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{t.title}</h1>
              <p className="text-sm text-slate-500">{provider === "paypal" ? t.subtitlePaypal : t.subtitlePaymob}</p>
            </div>
          )}

          {status === "paid" && (
            <div className="space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t.successTitle}</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">{t.successBody}</p>

              {payment && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.plan}</span>
                    <span className="font-bold text-slate-900">
                      {(PLAN_NAME[payment.plan_id] || PLAN_NAME.free)[lang]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.newQuota}</span>
                    <span className="font-bold text-slate-900">
                      {(QUOTA_LABEL[payment.plan_id] || QUOTA_LABEL.free)[lang]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.providerLabel}</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                      (payment.provider || provider) === "paypal"
                        ? "bg-[#003087] text-white"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {(payment.provider || provider) === "paypal" ? t.paypalLabel : t.paymobLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.receipt}</span>
                    <span className="font-mono text-xs text-slate-700 truncate max-w-[200px]">{payment.id}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
                >
                  <span>{t.goApp}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors"
                >
                  {t.goPricing}
                </Link>
              </div>
            </div>
          )}

          {status === "pending" && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{t.pendingTitle}</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">{t.pendingBody}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors"
                >
                  {t.goApp}
                </Link>
                <button
                  onClick={() => { setStatus("verifying"); setAttempts(0); stopPollingRef.current = false; window.location.reload(); }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-rose-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{t.failedTitle}</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">{t.failedBody}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
                >
                  {t.retry}
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                >
                  {t.goApp}
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{provider === "paypal" ? t.paypalSecure : t.paymobSecure}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
