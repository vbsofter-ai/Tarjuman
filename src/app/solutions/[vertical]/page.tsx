import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Scale,
  HeartPulse,
  TrendingUp,
  Cpu,
  GraduationCap,
  Briefcase,
  Globe,
  Check,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { VERTICALS, getVertical, VerticalSlug } from "@/src/lib/verticals";
import { getCanonicalUrl } from "@/src/lib/app-url";

type Lang = "ar" | "en";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  HeartPulse,
  TrendingUp,
  Cpu,
  GraduationCap,
  Briefcase,
};

const ACCENT_BG: Record<string, string> = {
  indigo: "from-indigo-50 to-violet-50",
  rose: "from-rose-50 to-pink-50",
  emerald: "from-emerald-50 to-teal-50",
  amber: "from-amber-50 to-yellow-50",
  sky: "from-sky-50 to-cyan-50",
  slate: "from-slate-50 to-gray-50",
};

const ACCENT_BTN: Record<string, string> = {
  indigo: "bg-indigo-600 hover:bg-indigo-700",
  rose: "bg-rose-600 hover:bg-rose-700",
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  amber: "bg-amber-600 hover:bg-amber-700",
  sky: "bg-sky-600 hover:bg-sky-700",
  slate: "bg-slate-900 hover:bg-slate-800",
};

const ACCENT_TEXT: Record<string, string> = {
  indigo: "text-indigo-700",
  rose: "text-rose-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  sky: "text-sky-700",
  slate: "text-slate-700",
};

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: slug } = await params;
  const v = getVertical(slug);
  if (!v) return { title: "Not found" };
  const isAr = (getCanonicalUrl(`/solutions/${v.slug}`) ?? "").endsWith(`/${v.slug}`);
  // The default locale is Arabic (matches the site). Provide both EN/AR
  // metadata by using the bilingual title in og:locale and an explicit
  // description in each language.
  return {
    title: `${v.nameEn} | Tarjuman`,
    description: v.valuePropEn,
    alternates: {
      canonical: getCanonicalUrl(`/solutions/${v.slug}`),
    },
    openGraph: {
      title: `${v.nameEn} | Tarjuman`,
      description: v.valuePropEn,
      url: getCanonicalUrl(`/solutions/${v.slug}`),
      type: "website",
      locale: "ar_EG",
      alternateLocale: ["en_US"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${v.nameEn} | Tarjuman`,
      description: v.valuePropEn,
    },
  };
}

export default async function VerticalPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical: slug } = await params;
  const v = getVertical(slug);
  if (!v) notFound();

  const Icon = ICON_MAP[v.icon] || Globe;
  const accentBg = ACCENT_BG[v.accent] || ACCENT_BG.indigo;
  const accentBtn = ACCENT_BTN[v.accent] || ACCENT_BTN.indigo;
  const accentText = ACCENT_TEXT[v.accent] || ACCENT_TEXT.indigo;

  // Build the Service schema for this vertical.
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": getCanonicalUrl(`/solutions/${v.slug}/#service`),
    name: v.nameEn,
    alternateName: v.nameAr,
    serviceType: "Translation",
    provider: { "@id": getCanonicalUrl("/#organization") },
    areaServed: ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "LB"],
    description: v.valuePropEn,
    url: getCanonicalUrl(`/solutions/${v.slug}`),
    offers: {
      "@type": "Offer",
      url: getCanonicalUrl("/pricing"),
      priceCurrency: "USD",
      price: "19.00",
      category: "subscription",
    },
  };

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Top nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-extrabold text-slate-900">Tarjuman</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/solutions" className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100">
              All verticals
            </Link>
            <Link
              href="/pricing"
              className={`text-xs font-bold text-white ${accentBtn} px-3 py-2 rounded-lg transition-colors`}
            >
              See pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className={`bg-gradient-to-b ${accentBg} pt-16 sm:pt-20 pb-12`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md ${accentText}`}>
            <Icon className="w-8 h-8" />
          </div>
          <p className="mt-6 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
            {v.nameEn} · {v.nameAr}
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {v.taglineEn}
          </h1>
          <p className="mt-3 text-lg text-slate-600 font-semibold" dir="rtl">
            {v.taglineAr}
          </p>
          <p className="mt-6 text-base sm:text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed">
            {v.valuePropEn}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold ${accentBtn} shadow-md transition-colors`}
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors"
            >
              Try the translator
            </Link>
          </div>
        </div>
      </header>

      {/* Features grid */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center">
            Why teams choose Tarjuman for {v.nameEn.toLowerCase()}
          </h2>
          <p className="mt-3 text-center text-slate-500 max-w-2xl mx-auto">
            Purpose-built for {v.nameEn.toLowerCase()} — not a generic translator with a domain dropdown.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {v.features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center ${accentText}`}>
                  <Check className="w-5 h-5" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">{f.en}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed" dir="rtl">{f.ar}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample terminology */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center">
            Sample terminology
          </h2>
          <p className="mt-3 text-center text-slate-500 max-w-2xl mx-auto">
            Industry-grade terms out of the box. Lock them to your own glossary at any time.
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 font-bold text-slate-700">English</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-700" dir="rtl">العربية</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-700 hidden sm:table-cell">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {v.sampleTerms.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-mono text-xs text-slate-800">{t.source}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-800" dir="rtl">{t.target}</td>
                    <td className="px-5 py-4 text-xs text-slate-500 hidden sm:table-cell">
                      {t.noteEn} · <span dir="rtl">{t.noteAr}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Other verticals */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center">
            Explore other verticals
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {VERTICALS.filter((other) => other.slug !== v.slug).map((other) => {
              const OtherIcon = ICON_MAP[other.icon] || Globe;
              return (
                <Link
                  key={other.slug}
                  href={`/solutions/${other.slug}`}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center ${accentText}`}>
                    <OtherIcon className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-sm font-extrabold text-slate-900">{other.nameEn}</p>
                  <p className="mt-1 text-xs text-slate-500" dir="rtl">{other.nameAr}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust footer */}
      <section className="py-10 px-4 sm:px-6 border-t border-slate-200 bg-slate-50">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>SOC-ready data handling. No training on your content.</span>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900"
          >
            <Sparkles className="w-3.5 h-3.5" />
            See plans
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
