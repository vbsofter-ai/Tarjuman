import React, { useState } from "react";
import { Check, Star, Shield, Zap, Sparkles, Loader2 } from "lucide-react";
import { PRICING_PLANS, formatPrice, PlanId, BillingPeriod, PaymentProvider } from "../constants";
import { User } from "../types";

interface PricingTableProps {
  currentUser: User | null;
  onSubscribe: (planId: PlanId, billingPeriod: BillingPeriod, provider: PaymentProvider) => Promise<void> | void;
  isArabic: boolean;
  loadingPlanId?: PlanId | null;
  provider: PaymentProvider;
  onProviderChange?: (p: PaymentProvider) => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({
  currentUser,
  onSubscribe,
  isArabic,
  loadingPlanId = null,
  provider,
  onProviderChange,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const currency: "EGP" | "USD" = provider === "paypal" ? "USD" : "EGP";

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-8">
      {/* Header and Toggle */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isArabic ? "خطط الأسعار ومميزات الترقية" : "Pricing Plans & Custom Quotas"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          {isArabic
            ? "ترجم عقودك وملفاتك بأفضل جودة وصياغة لغوية خالية من الأخطاء عبر ترقية باقتك فوراً"
            : "Supercharge your business, medical, or legal translations by choosing a plan suited to your scale."}
        </p>

        {/* Payment Provider Toggle */}
        {onProviderChange && (
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => onProviderChange("paymob")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                provider === "paymob"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${provider === "paymob" ? "bg-emerald-400" : "bg-slate-300"}`} />
              <span>{isArabic ? "Paymob • جنيه مصري" : "Paymob • EGP"}</span>
            </button>
            <button
              onClick={() => onProviderChange("paypal")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                provider === "paypal"
                  ? "bg-[#003087] text-white border-[#003087] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${provider === "paypal" ? "bg-[#009cde]" : "bg-slate-300"}`} />
              <span>{isArabic ? "PayPal • دولار أمريكي" : "PayPal • USD"}</span>
            </button>
          </div>
        )}

        {/* Billing Toggle Switch */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-xs font-bold ${billingPeriod === "monthly" ? "text-slate-800" : "text-slate-400"}`}>
            {isArabic ? "دفع شهري" : "Monthly"}
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
            className="w-12 h-6 bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition-colors relative focus:outline-none"
          >
            <div
              className={`w-4 h-4 bg-indigo-600 rounded-full transition-all absolute top-1 ${
                billingPeriod === "yearly" ? "left-1" : "left-7"
              }`}
            />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingPeriod === "yearly" ? "text-indigo-600" : "text-slate-400"}`}>
            <span>{isArabic ? "دفع سنوي" : "Yearly"}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
              {isArabic ? "توفير 20%" : "Save 20%"}
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = currentUser?.plan === plan.id;
          const isLoading = loadingPlanId === plan.id;
          const disabled = isCurrent || (loadingPlanId !== null && loadingPlanId !== plan.id);

          // Pick the right amount fields based on the chosen provider.
          const amountCents =
            provider === "paypal"
              ? (billingPeriod === "monthly" ? plan.amountMonthlyCentsUSD : plan.amountYearlyCentsUSD)
              : (billingPeriod === "monthly" ? plan.amountMonthlyCents : plan.amountYearlyCents);
          const displayPrice = formatPrice(amountCents, isArabic ? "ar" : "en", billingPeriod, currency);
          const features = isArabic ? plan.featuresAr : plan.featuresEn;

          // Choose CTA label per provider.
          const ctaLabel = isArabic
            ? (provider === "paypal" ? "ادفع بـ PayPal" : "ادفع بـ Paymob")
            : (provider === "paypal" ? "Pay with PayPal" : "Pay with Paymob");

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between border transition-all relative ${
                plan.popular
                  ? "border-indigo-600 bg-white ring-4 ring-indigo-500/5 shadow-xl scale-[1.02]"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-full shadow-md tracking-wider">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{isArabic ? "الأكثر مبيعاً" : "Most Popular"}</span>
                </span>
              )}

              {/* Card Header */}
              <div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-800">
                    {isArabic ? plan.nameAr : plan.nameEn}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isArabic ? plan.limitDescAr : plan.limitDescEn}
                  </p>
                </div>

                {/* Price Label */}
                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{displayPrice}</span>
                </div>

                {/* Features Checklist */}
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

              {/* Subscribe CTA Button */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <button
                  onClick={() => onSubscribe(plan.id as PlanId, billingPeriod, provider)}
                  disabled={disabled}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-default"
                      : plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isArabic ? "جارٍ التحويل…" : "Redirecting…"}</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isArabic ? "باقاتك النشطة الحالية" : "Active Plan"}</span>
                    </>
                  ) : (
                    <>
                      {plan.id === "pro" ? (
                        <Zap className="w-3.5 h-3.5 fill-current" />
                      ) : plan.id === "enterprise" ? (
                        <Shield className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{ctaLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
