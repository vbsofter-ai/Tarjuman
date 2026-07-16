"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

/**
 * Global error boundary. Catches unhandled errors in any route and shows
 * a friendly recovery page. Logs the error to the console for debugging.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real deployment, this is where you'd ship to Sentry / LogRocket
    // / your error aggregator. For now we just log to the console.
    console.error("[App] Unhandled error:", { message: error?.message, digest: error?.digest });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-50 text-rose-600 shadow-sm">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            We&apos;ve hit an unexpected error. The team has been notified. Please try again.
          </p>
          {error?.digest && (
            <p className="mt-2 font-mono text-[10px] text-slate-400">Error ID: {error.digest}</p>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Try again</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Go home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
