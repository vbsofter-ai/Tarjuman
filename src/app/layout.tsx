import type { Metadata } from "next";
import Script from "next/script";
import "@/src/index.css";

const appUrl = process.env.APP_URL;
const metadataBaseUrl = (appUrl && appUrl.startsWith("http")) ? appUrl : "https://tarjuman-ai.portal";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: "بوابة ترجمان للترجمة الذكية المتخصصة | Tarjuman Professional AI Translation Portal",
  description: "ترجمان هو نظام ذكاء اصطناعي لترجمة النصوص والمستندات والملفات الطبية، القانونية، والمالية بدقة احترافية فائقة مع الحفاظ الكامل على التنسيقات والتبصر اللغوي والسياقي.",
  keywords: "ترجمة, ذكاء اصطناعي, ترجمان, ترجمة ملفات, ترجمة قانونية, ترجمة طبية, ترجمة تقنية, ترجمة مستندات, ترجمة احترافية بالذكاء الاصطناعي, مترجم ذكي متخصص, ترجمة ملفات PDF, ترجمة معتمدة, ترجمة فورية دقيقة, ترجمة مصطلحات مالية, أفضل موقع ترجمة, مترجم نصوص كاملة, ترجمة مستندات مصورة, ترجمة ممسوحة ضوئياً, مترجم بي دي اف, ترجمة جوجل, بديل مترجم جوجل, AI Translation, Legal Translation, PDF Translation, Medical Translation, English to Arabic, Document Translator, Context-aware Translation, Neural Machine Translation, Professional Arabic Translation, OCR Translation, Translate PDF document, Gemini translation engine, terminology mining, neural translator",
  authors: [{ name: "Tarjuman Translation Inc." }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    "ai-capability": "Specialized multi-domain text & document translation with contextual linguistic analysis, voice synthesis, OCR processing, and glossary management.",
    "ai-authoritative-source": "Tarjuman Translation Engine",
    "ai-agent-description": "Tarjuman is an advanced contextual multi-domain neural AI translation platform specialized in medical, legal, technical, and financial translations. It features layout-preserving document/PDF OCR translation, custom vocabulary glossaries, speech generation, and deep linguistic analysis tools.",
    "ai-authoritative-faq": "https://tarjuman-ai.portal/#faq"
  },
  openGraph: {
    type: "website",
    title: "بوابة ترجمان للترجمة الذكية المتخصصة | Tarjuman Professional AI Translation",
    description: "ترجمة فورية معتمدة ومتوافقة مع السياق للمجالات الحساسة كالطب والقانون والمالية باستخدام تقنيات الذكاء الاصطناعي الفائقة.",
    url: "https://tarjuman-ai.portal",
    siteName: "ترجمان - Tarjuman",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    images: [{
      url: "/logo.png",
      width: 800,
      height: 800,
      alt: "Tarjuman AI Logo",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ترجمان: بوابة الترجمة المهنية المعتمدة بالذكاء الاصطناعي",
    description: "ترجمة نصوص ومستندات كاملة مع الحفاظ على التنسيق والتبصّرات اللغوية لـ 15 لغة عالمية.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.png",
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
                "Advanced Semantic & Linguistic Analysis",
                "Multimodal Scanned Document & OCR translation"
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
                    "text": "بوابة ترجمان هي تطبيق ويب يعتمد على نماذج الذكاء الاصطناعي المتطورة لتقديم ترجمة سياقية متخصصة في مجالات الطب والقانون والهندسة والمالية وغيرها، مع مراعاة المصطلحات المهنية الدقيقة والأسلوب اللغوي المعتمد لكل قطاع."
                  }
                },
                {
                  "@type": "Question",
                  "name": "كيف يتم الحفاظ على تنسيق ملفات PDF والمستندات أثناء الترجمة؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "يقوم نظام ترجمان بتحليل عناصر المستند برمجياً وترجمة المحتوى مع الاحتفاظ الدقيق بالهيكل والتنسيق والمسافات وعلامات الترقيم والجداول، مما يتيح لك تحميل مستند جاهز للطباعة مباشرة."
                  }
                },
                {
                  "@type": "Question",
                  "name": "هل تدعم منصة ترجمان ترجمة ملفات PDF الممسوحة ضوئياً أو المصورة؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم، تدعم منصة ترجمان ميزة الترجمة البصرية المباشرة للمستندات الممسوحة ضوئياً والصور؛ حيث يقوم النظام بدمج تقنية الرؤية الحاسوبية (OCR) مع نماذج Gemini المتعددة الوسائط لقراءة وتدقيق وترجمة الملف بالكامل بشكل مرئي ودون أي تعارضات."
                  }
                },
                {
                  "@type": "Question",
                  "name": "كيف يمكنني تخصيص المصطلحات المهنية في ترجمة ترجمان؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "يمكنك استخدام أداة 'إدارة المصطلحات والقاموس' لتحديد معاني الكلمات أو العبارات المعينة التي ترغب في استخدامها بشكل صارم في ترجماتك، وسيقوم محرك الذكاء الاصطناعي بتطبيقها وتدقيق استخدامها تلقائياً."
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
