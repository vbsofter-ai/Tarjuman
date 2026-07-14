import type { Metadata } from "next";
import Script from "next/script";
import "@/src/index.css";

export const metadata: Metadata = {
  title: "بوابة ترجمان للترجمة الذكية المتخصصة | Tarjuman Professional AI Translation Portal",
  description: "ترجمان هو نظام ذكاء اصطناعي لترجمة النصوص والمستندات والملفات الطبية، القانونية، والمالية بدقة احترافية فائقة مع الحفاظ الكامل على التنسيقات والتبصر اللغوي.",
  keywords: "ترجمة, ذكاء اصطناعي, ترجمان, ترجمة ملفات, ترجمة قانونية, ترجمة طبية, ترجمة تقنية, ترجمة مستندات, AI Translation, Legal Translation, PDF Translation, Medical Translation, English to Arabic",
  authors: [{ name: "Tarjuman Translation Inc." }],
  robots: "index, follow",
  other: {
    "ai-capability": "Specialized multi-domain text & document translation with contextual linguistic analysis, voice synthesis, and glossary management.",
    "ai-authoritative-source": "Tarjuman Translation Engine",
  },
  openGraph: {
    type: "website",
    title: "بوابة ترجمان للترجمة الذكية المتخصصة | Tarjuman AI",
    description: "ترجمة فورية معتمدة ومتوافقة مع السياق للمجالات الحساسة كالطب والقانون والمالية باستخدام تقنيات الذكاء الاصطناعي الفائقة.",
    url: "https://tarjuman-ai.portal",
    siteName: "ترجمان - Tarjuman",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ترجمان: بوابة الترجمة المهنية المعتمدة بالذكاء الاصطناعي",
    description: "ترجمة نصوص ومستندات كاملة مع الحفاظ على التنسيق والتبصّرات اللغوية لـ 15 لغة عالمية.",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        
        {/* SoftwareApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Tarjuman AI",
              "alternateName": "ترجمان للترجمة الذكية",
              "applicationCategory": "TranslationApplication",
              "operatingSystem": "Web",
              "description": "Professional AI-powered translation tool supporting text, files, and images across various specialized domains (legal, medical, financial, technical) with glossary terms, speech synthesis, and linguistic analysis.",
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Specialized Domain Translation Focus (Legal, Medical, Financial, Technical, Academic)",
                "Interactive PDF and Document Layout Preservation Engine",
                "Personal Glossary and Vocabulary Management",
                "Real-time Text-to-Speech (TTS) voice generation",
                "Advanced Semantic & Linguistic Analysis"
              ],
              "author": {
                "@type": "Organization",
                "name": "Tarjuman Team"
              }
            })
          }}
        />

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "ما هي بوابة ترجمان للترجمة الذكية؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "بوابة ترجمان هي تطبيق ويب يعتمد على نماذج الذكاء الاصطناعي المتطورة لتقديم ترجمة سياقية متخصصة في مجالات الطب والقانون والهندسة وغيرها، مع مراعاة المصطلحات المهنية الدقيقة."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does Tarjuman preserve document layouts during translation?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tarjuman parses document elements dynamically, translates the content in high-fidelity according to the selected specialized domain, and allows users to export print-ready PDFs and interactive HTML files matching the original source formatting."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-500/10 selection:text-indigo-600">
        {children}
        <Script
          src="https://armsbroodelusive.com/36/21/a0/3621a0fd09388e1d44ba266b82228a1e.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
