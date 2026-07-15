"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Star, Shield, Zap, Sparkles, Globe, Loader2, AlertTriangle, CreditCard } from "lucide-react";
import { PRICING_PLANS, formatPrice, BillingPeriod, PlanId, PaymentProvider, DEFAULT_PROVIDER } from "@/src/constants";

type Lang = "ar" | "en";

const T = {
  ar: {
    navHome: "الصفحة الرئيسية",
    navPricing: "الأسعار والخطط",
    signIn: "تسجيل الدخول",
    backToApp: "العودة إلى ترجمان",
    badge: "الأسعار والاشتراكات",
    heroTitle: "باقات مدفوعة تناسب حجم عملك",
    heroSubtitle: "ترجم عقودك وملفاتك الطبية والقانونية بأفضل جودة عبر ترقية باقتك فوراً. ادفع بأمان عبر بوابات الدفع المعتمدة، وفعّل اشتراكك في ثوانٍ.",
    paymentMethod: "اختر طريقة الدفع",
    paymobLabel: "Paymob (الجنيه المصري)",
    paypalLabel: "PayPal (الدولار الأمريكي)",
    secureTitle: "دفع آمن ومشفّل",
    secureSubtitle: "جميع المدفوعات مشفّلة ومؤمّنة عبر بوابات الدفع المعتمدة عالمياً ومحلياً.",
    periodMonthly: "دفع شهري",
    periodYearly: "دفع سنوي",
    saveBadge: "توفير 20%",
    popularBadge: "الأكثر مبيعاً",
    mostPopular: "الأكثر شعبية",
    activePlan: "باقتك النشطة",
    chooseFree: "البدء مجاناً",
    requiresAuthTitle: "يلزم تسجيل الدخول أولاً",
    requiresAuthBody: "لحماية حسابك ومنع إساءة استخدام الباقات، يرجى تسجيل الدخول بحساب Google قبل إتمام الاشتراك.",
    goSignIn: "الانتقال لتسجيل الدخول",
    processing: "جارٍ التحويل لبوابة الدفع…",
    checkoutFailed: "تعذّر إنشاء جلسة الدفع. حاول مرة أخرى أو تواصل مع الدعم.",
    paymobNotConfigured: "بوابة Paymob غير مهيّأة حالياً على السيرفر.",
    paypalNotConfigured: "بوابة PayPal غير مهيّأة حالياً على السيرفر.",
    guaranteeTitle: "ضمان استرداد خلال 14 يوم",
    guaranteeBody: "إذا لم تكن راضياً عن باقتك المدفوعة، يمكنك طلب استرداد كامل خلال 14 يوماً من تاريخ الدفع بدون أي أسئلة.",
    faqTitle: "أسئلة شائعة",
    q1: "هل يمكنني إلغاء اشتراكي؟",
    a1: "نعم، يمكنك إلغاء اشتراكك في أي وقت من صفحة إعدادات حسابك. سيستمر وصولك حتى نهاية فترة الفوترة الحالية.",
    q2: "ما هي طرق الدفع المدعومة؟",
    a2: "نقبل Paymob (بطاقات ائتمان ومصرية ومحافظ إلكترونية) و PayPal (بطاقات ائتمان دولية).",
    q3: "هل ستفقد كلماتي غير المستخدمة عند الترقية؟",
    a3: "لا، رصيد الكلمات الحالي ينتقل بالكامل إلى باقتك الجديدة فور تأكيد الدفع.",
    q4: "هل الباقة المؤسسية قابلة للتفاوض؟",
    a4: "بالتأكيد. تواصل معنا عبر النموذج وسنخصص لك عرضاً يناسب حجم فريقك واحتياجاتك.",
    q5: "أي طريقة دفع أنسب لي؟",
    a5: "إذا كنت في مصر، Paymob أسرع وأقل رسوماً. إذا كنت تتعامل دولياً أو تفضل PayPal، استخدم PayPal.",
    footerRights: "جميع الحقوق محفوظة",
    trustedBy: "موثوق به من قبل آلاف المترجمين والفرق في الشرق الأوسط",
  },
  en: {
    navHome: "Home",
    navPricing: "Pricing",
    signIn: "Sign in",
    backToApp: "Back to Tarjuman",
    badge: "Pricing & Subscriptions",
    heroTitle: "Paid plans that scale with your work",
    heroSubtitle: "Translate medical, legal and technical documents with the highest quality by upgrading your plan instantly. Pay securely through certified payment gateways and activate your subscription in seconds.",
    paymentMethod: "Choose your payment method",
    paymobLabel: "Paymob (Egyptian Pound)",
    paypalLabel: "PayPal (US Dollar)",
    secureTitle: "Secure & encrypted payments",
    secureSubtitle: "All payments are encrypted and processed by certified local and international payment gateways.",
    periodMonthly: "Monthly",
    periodYearly: "Yearly",
    saveBadge: "Save 20%",
    popularBadge: "Most Popular",
    mostPopular: "Most popular",
    activePlan: "Active plan",
    chooseFree: "Get Started",
    requiresAuthTitle: "Please sign in first",
    requiresAuthBody: "To protect your account and prevent abuse, please sign in with Google before completing the subscription.",
    goSignIn: "Go to sign-in",
    processing: "Redirecting to secure checkout…",
    checkoutFailed: "Could not create the payment session. Please try again or contact support.",
    paymobNotConfigured: "Paymob is not configured on the server right now.",
    paypalNotConfigured: "PayPal is not configured on the server right now.",
    guaranteeTitle: "14-day money-back guarantee",
    guaranteeBody: "If you are not satisfied with your paid plan, you can request a full refund within 14 days — no questions asked.",
    faqTitle: "Frequently asked questions",
    q1: "Can I cancel my subscription?",
    a1: "Yes, you can cancel anytime from your account settings. You will keep access until the end of the current billing period.",
    q2: "Which payment methods are supported?",
    a2: "We accept Paymob (credit / debit / Meeza / mobile wallets) and PayPal (international credit / debit cards).",
    q3: "Will I lose my unused words when I upgrade?",
    a3: "No, your current word balance rolls over to your new plan the moment your payment is confirmed.",
    q4: "Is the Enterprise plan negotiable?",
    a4: "Absolutely. Get in touch and we will tailor an offer for your team size and needs.",
    q5: "Which payment method should I use?",
    a5: "If you are in Egypt, Paymob is faster and has lower fees. If you transact internationally or prefer PayPal, use PayPal.",
    footerRights: "All rights reserved",
    trustedBy: "Trusted by thousands of translators and teams across the Middle East",
  },
};

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [provider, setProvider] = useState<PaymentProvider>(DEFAULT_PROVIDER);
  const [user, setUser] = useState<{ email: string; name: string; plan: string } | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = T[lang];
  const isRtl = lang === "ar";
  const currency: "EGP" | "USD" = provider === "paypal" ? "USD" : "EGP";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get("lang");
    if (queryLang === "en" || queryLang === "ar") {
      setLang(queryLang);
    } else {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("tarjuman_ui_lang") : null;
      if (stored === "en" || stored === "ar") setLang(stored);
    }
    const qp = params.get("provider");
    if (qp === "paypal" || qp === "paymob") setProvider(qp);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("tarjuman_ui_lang", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    } catch {}
  }, [lang, isRtl]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tarjuman_current_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) {
          setUser({ email: parsed.email, name: parsed.name, plan: parsed.plan });
        }
      }
    } catch {}
  }, []);

  const handleSubscribe = async (planId: PlanId) => {
    setError(null);
    if (!user) {
      setError(t.requiresAuthBody);
      return;
    }
    if (planId === "free") {
      try {
        setLoadingPlan("free");
        const res = await fetch("/api/auth/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, planId: "free" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed");
        const updated = { ...user, plan: "free" };
        setUser(updated);
        window.localStorage.setItem("tarjuman_current_user", JSON.stringify({ ...JSON.parse(window.localStorage.getItem("tarjuman_current_user") || "{}"), ...data }));
      } catch (err: any) {
        setError(err?.message || t.checkoutFailed);
      } finally {
        setLoadingPlan(null);
      }
      return;
    }

    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          planId,
          billingPeriod: period,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          if (provider === "paypal") {
            throw new Error(t.paypalNotConfigured);
          }
          throw new Error(t.paymobNotConfigured);
        }
        throw new Error(data?.error || t.checkoutFailed);
      }
      // Paymob returns iframeUrl; PayPal returns approvalUrl.
      const target = data?.iframeUrl || data?.approvalUrl;
      if (target) {
        try {
          sessionStorage.setItem("tarjuman_pending_payment", data.paymentId || "");
          sessionStorage.setItem("tarjuman_pending_provider", provider);
        } catch {}
        window.location.href = target;
        return;
      }
    } catch (err: any) {
      setError(err?.message || t.checkoutFailed);
    } finally {
      setLoadingPlan(null);
    }
  };

  const renderPlanCTA = (planId: PlanId, cta: string) => {
    const isCurrent = user?.plan === planId;
    const isLoading = loadingPlan === planId;
    const disabled = isCurrent || (loadingPlan !== null && loadingPlan !== planId);
    return (
      <button
        onClick={() => handleSubscribe(planId)}
        disabled={disabled || isLoading}
        className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          isCurrent
            ? "bg-slate-100 text-slate-500 border border-slate-200"
            : planId === "pro"
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            : planId === "enterprise"
            ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md"
            : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t.processing}</span>
          </>
        ) : isCurrent ? (
          <>
            <Check className="w-4 h-4" />
            <span>{t.activePlan}</span>
          </>
        ) : (
          <>
            {planId === "pro" ? <Zap className="w-4 h-4 fill-current" /> : planId === "enterprise" ? <Shield className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{cta}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 ${isRtl ? "font-tajawal" : "font-sans"}`}>
      {/* Top nav */}
      <nav className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold text-slate-900">Tarjuman</span>
              <span className="text-[10px] text-slate-500 font-semibold">ترجمان</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden sm:inline-flex text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              {t.navHome}
            </Link>
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="text-xs font-bold text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            {!user && (
              <Link href="/" className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors">
                {t.signIn}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 sm:pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            {t.badge}
          </span>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t.heroTitle}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>{t.secureTitle}</span>
            <span className="text-emerald-600/80 hidden sm:inline">— {t.secureSubtitle}</span>
          </div>
        </div>
      </section>

      {/* Payment method + Billing toggle */}
      <section className="px-4 sm:px-6 pb-4 space-y-4">
        {/* Payment method selector */}
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
            {t.paymentMethod}
          </p>
          <div className="flex items-stretch justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setProvider("paymob")}
              className={`flex-1 max-w-[260px] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                provider === "paymob"
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[10px] flex-shrink-0 ${provider === "paymob" ? "bg-white/20" : "bg-emerald-50 text-emerald-700"}`}>
                EGP
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-extrabold">Paymob</span>
                <span className={`text-[10px] font-semibold ${provider === "paymob" ? "text-white/70" : "text-slate-500"}`}>
                  {lang === "ar" ? "الجنيه المصري" : "Egyptian Pound"}
                </span>
              </div>
              {provider === "paymob" && <Check className="w-4 h-4 ms-auto" />}
            </button>
            <button
              onClick={() => setProvider("paypal")}
              className={`flex-1 max-w-[260px] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                provider === "paypal"
                  ? "bg-[#003087] text-white border-[#003087] shadow-lg"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[10px] flex-shrink-0 ${provider === "paypal" ? "bg-white/20" : "bg-blue-50 text-[#003087]"}`}>
                USD
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-extrabold">PayPal</span>
                <span className={`text-[10px] font-semibold ${provider === "paypal" ? "text-white/70" : "text-slate-500"}`}>
                  {lang === "ar" ? "الدولار الأمريكي" : "US Dollar"}
                </span>
              </div>
              {provider === "paypal" && <Check className="w-4 h-4 ms-auto" />}
            </button>
          </div>
        </div>

        {/* Billing period toggle */}
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <span className={`text-sm font-bold ${period === "monthly" ? "text-slate-900" : "text-slate-400"}`}>
            {t.periodMonthly}
          </span>
          <button
            onClick={() => setPeriod(period === "monthly" ? "yearly" : "monthly")}
            className="relative w-14 h-7 bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <div
              className={`w-5 h-5 bg-indigo-600 rounded-full transition-all absolute top-1 shadow-sm ${
                period === "yearly" ? "left-1" : "left-8"
              }`}
            />
          </button>
          <span className={`text-sm font-bold flex items-center gap-1.5 ${period === "yearly" ? "text-indigo-600" : "text-slate-400"}`}>
            {t.periodYearly}
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-extrabold">
              {t.saveBadge}
            </span>
          </span>
        </div>
      </section>

      {/* Plans grid */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = user?.plan === plan.id;
            const amountCents =
              provider === "paypal"
                ? (period === "monthly" ? plan.amountMonthlyCentsUSD : plan.amountYearlyCentsUSD)
                : (period === "monthly" ? plan.amountMonthlyCents : plan.amountYearlyCents);
            const displayPrice = formatPrice(amountCents, lang, period, currency);
            const features = isRtl ? plan.featuresAr : plan.featuresEn;
            const limitDesc = isRtl ? plan.limitDescAr : plan.limitDescEn;
            const name = isRtl ? plan.nameAr : plan.nameEn;
            const cta = isRtl ? plan.ctaAr : plan.ctaEn;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col border transition-all ${
                  plan.popular
                    ? "border-indigo-600 bg-white ring-4 ring-indigo-500/10 shadow-2xl scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-[10px] font-extrabold uppercase rounded-full shadow-md tracking-wider">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{t.mostPopular}</span>
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{name}</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">{limitDesc}</p>
                  <div className="my-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                      {displayPrice}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    {features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="p-0.5 bg-indigo-50 text-indigo-600 rounded-md flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-slate-600 leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  {renderPlanCTA(plan.id, cta)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Error notice */}
      {error && (
        <section className="px-4 sm:px-6 pb-6">
          <div className="max-w-3xl mx-auto p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t.requiresAuthTitle}</p>
              <p className="text-rose-700 mt-1">{error}</p>
              {!user && (
                <Link href="/" className="inline-block mt-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg">
                  {t.goSignIn}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Guarantee */}
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-start gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-emerald-900">{t.guaranteeTitle}</h3>
            <p className="text-sm text-emerald-800/80 mt-1 leading-relaxed">{t.guaranteeBody}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">{t.faqTitle}</h2>
          <div className="space-y-3">
            {[
              { q: t.q1, a: t.a1 },
              { q: t.q2, a: t.a2 },
              { q: t.q3, a: t.a3 },
              { q: t.q4, a: t.a4 },
              { q: t.q5, a: t.a5 },
            ].map((item, i) => (
              <details key={i} className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <summary className="cursor-pointer font-bold text-slate-800 text-sm flex items-center justify-between">
                  <span>{item.q}</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Trust line */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>{t.trustedBy}</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-700">Tarjuman • ترجمان</span>
          </div>
          <p>© {new Date().getFullYear()} Tarjuman. {t.footerRights}.</p>
          <Link href="/" className="font-bold text-slate-600 hover:text-slate-900">
            {t.backToApp} ←
          </Link>
        </div>
      </footer>
    </div>
  );
}
