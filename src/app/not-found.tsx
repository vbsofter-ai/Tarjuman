import Link from "next/link";
import { Compass, Home, Globe, ArrowRight, Search } from "lucide-react";

export const metadata = {
  title: "Page Not Found | Tarjuman",
  robots: { index: false, follow: false },
};

const QUICK_LINKS = [
  { href: "/", label: "Home", labelAr: "الرئيسية" },
  { href: "/pricing", label: "Pricing", labelAr: "الأسعار" },
  { href: "/solutions", label: "Solutions", labelAr: "الحلول" },
  { href: "/solutions/legal", label: "Legal Translation", labelAr: "الترجمة القانونية" },
  { href: "/solutions/medical", label: "Medical Translation", labelAr: "الترجمة الطبية" },
  { href: "/solutions/financial", label: "Financial Translation", labelAr: "الترجمة المالية" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
          <Compass className="w-10 h-10" />
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-wider text-slate-500">404</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-lg text-slate-500 max-w-md mx-auto">
          The page you were looking for has been moved, deleted, or never existed. Let&apos;s get you back on track.
        </p>
        <p className="mt-2 text-base text-slate-500" dir="rtl">
          الصفحة التي تبحث عنها غير موجودة. عدنا إلى المسار الصحيح.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back home</span>
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors"
          >
            <span>View pricing</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
            <Search className="w-3 h-3" />
            <span>Or try one of these</span>
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all text-left"
              >
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-slate-400" />
                  {q.label}
                </p>
                <p className="mt-1 text-[11px] text-slate-500" dir="rtl">{q.labelAr}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
