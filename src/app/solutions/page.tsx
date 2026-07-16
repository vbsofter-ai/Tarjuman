import Link from "next/link";
import type { Metadata } from "next";
import {
  Scale,
  HeartPulse,
  TrendingUp,
  Cpu,
  GraduationCap,
  Briefcase,
  Globe,
  ArrowRight,
} from "lucide-react";
import { VERTICALS } from "@/src/lib/verticals";
import { getCanonicalUrl } from "@/src/lib/app-url";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  HeartPulse,
  TrendingUp,
  Cpu,
  GraduationCap,
  Briefcase,
};

export const metadata: Metadata = {
  title: "Solutions by Industry | Tarjuman",
  description:
    "Specialized AI translation for legal, medical, financial, technical, academic, and commercial teams. Native-quality terminology out of the box.",
  alternates: {
    canonical: getCanonicalUrl("/solutions"),
  },
  openGraph: {
    title: "Solutions by Industry | Tarjuman",
    description: "Specialized AI translation for legal, medical, financial, technical, academic, and commercial teams.",
    url: getCanonicalUrl("/solutions"),
    type: "website",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
  },
};

export default function SolutionsIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-extrabold text-slate-900">Tarjuman</span>
          </Link>
          <Link
            href="/pricing"
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors"
          >
            See pricing
          </Link>
        </div>
      </nav>

      <header className="pt-16 sm:pt-20 pb-12 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Purpose-built translation for every industry
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tarjuman ships with vertical-specific terminology, register, and constraints — not a generic
            translator with a dropdown. Pick your industry and start translating in seconds.
          </p>
        </div>
      </header>

      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VERTICALS.map((v) => {
            const Icon = ICON_MAP[v.icon] || Globe;
            return (
              <Link
                key={v.slug}
                href={`/solutions/${v.slug}`}
                className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  {v.nameEn}
                  <span className="ms-2 text-sm font-semibold text-slate-400" dir="rtl">
                    {v.nameAr}
                  </span>
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{v.taglineEn}</p>
                <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
                  Learn more
                  <ArrowRight className="w-3.5 h-3.5 ms-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
