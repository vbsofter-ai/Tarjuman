import type { Metadata } from "next";
import "@/src/index.css";

import { getSystemConfig } from "@/src/lib/server-db";
import { startSeoScheduler } from "@/src/lib/seo-updater";
import { getAppOrigin, getCanonicalUrl, isProductionOrigin } from "@/src/lib/app-url";

export const dynamic = "force-dynamic";

const SITE_NAME_AR = "ترجمان - Tarjuman";
const OG_LOCALE = "ar_EG";
const OG_LOCALE_ALT = ["en_US"];

export async function generateMetadata(): Promise<Metadata> {
  let title = "بوابة ترجمان للترجمة الذكية المتخصصة | Tarjuman Professional AI Translation Portal";
  let description = "ترجمان هو نظام ذكاء اصطناعي لترجمة النصوص والمستندات والملفات الطبية، القانونية، والمالية بدقة احترافية فائقة مع الحفاظ الكامل على التنسيقات والتبصر اللغوي والسياقي.";
  let keywords = "ترجمة, ذكاء اصطناعي, ترجمان, ترجمة ملفات, ترجمة قانونية, ترجمة طبية, ترجمة تقنية, ترجمة مستندات, ترجمة احترافية بالذكاء الاصطناعي, مترجم ذكي متخصص, ترجمة ملفات PDF, ترجمة معتمدة, ترجمة فورية دقيقة, ترجمة مصطلحات مالية, أفضل موقع ترجمة, مترجم نصوص كاملة, ترجمة مستندات مصورة, ترجمة ممسوحة ضوئياً, مترجم بي دي اف, ترجمة جوجل, بديل مترجم جوجل, AI Translation, Legal Translation, PDF Translation, Medical Translation, English to Arabic, Document Translator, Context-aware Translation, Neural Machine Translation, Professional Arabic Translation, OCR Translation, Translate PDF document, Gemini translation engine, terminology mining, neural translator";
  let aeoAgentDescription = "Tarjuman is an advanced contextual multi-domain neural AI translation platform specialized in medical, legal, technical, and financial translations. It features layout-preserving document/PDF OCR translation, custom vocabulary glossaries, speech generation, and deep linguistic analysis tools.";

  // Pull the latest auto-generated SEO/AEO values from the DB. The
  // seo-updater scheduler refreshes these every 24h so the home page
  // always reflects fresh keyword strategy + AI-crawler description.
  try {
    const config = await getSystemConfig();
    if (config.seo_title) title = config.seo_title;
    if (config.seo_description) description = config.seo_description;
    if (config.seo_keywords) keywords = config.seo_keywords;
    if (config.aeo_agent_description) aeoAgentDescription = config.aeo_agent_description;
  } catch (error) {
    console.error("Failed to load metadata dynamically:", error);
  }

  const origin = getAppOrigin();
  const canonicalHome = getCanonicalUrl("/");

  return {
    metadataBase: new URL(origin),
    title,
    description,
    keywords,
    authors: [{ name: "Tarjuman Translation Inc." }],
    alternates: {
      canonical: canonicalHome,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "ai-capability": "Specialized multi-domain text & document translation with contextual linguistic analysis, voice synthesis, OCR processing, and glossary management.",
      "ai-authoritative-source": "Tarjuman Translation Engine",
      "ai-agent-description": aeoAgentDescription,
      "ai-authoritative-faq": getCanonicalUrl("/#faq"),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalHome,
      siteName: SITE_NAME_AR,
      locale: OG_LOCALE,
      alternateLocale: OG_LOCALE_ALT,
      images: [
        {
          url: getCanonicalUrl("/logo.png"),
          width: 800,
          height: 800,
          alt: "Tarjuman AI Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getCanonicalUrl("/logo.png")],
    },
    icons: {
      icon: "/favicon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start the background SEO checking scheduler
  try {
    startSeoScheduler();
  } catch (err) {
    console.error("Failed to start SEO scheduler:", err);
  }

  const siteUrl = getAppOrigin();

  // Pull the latest auto-generated SEO/AEO state from the DB so the
  // organization-level Schema.org JSON-LD reflects fresh FAQ items and
  // capability bullets. If the daily updater has never run (e.g. cold
  // start before the scheduler kicks in), we fall back to a static copy.
  let dynamicFaq: Array<{ questionAr: string; questionEn: string; answerAr: string; answerEn: string }> = [];
  let dynamicCapabilities: string[] = [];
  let dynamicAeoDescription: string | null = null;
  let lastSeoUpdate: string | null = null;
  try {
    const config = await getSystemConfig();
    if (Array.isArray(config.seo_faq)) dynamicFaq = config.seo_faq as any[];
    if (Array.isArray(config.aeo_capability_list)) dynamicCapabilities = config.aeo_capability_list as string[];
    if (typeof config.aeo_agent_description === "string" && config.aeo_agent_description.trim()) {
      dynamicAeoDescription = config.aeo_agent_description.trim();
    }
    if (typeof config.last_seo_update === "string") lastSeoUpdate = config.last_seo_update;
  } catch (err) {
    console.error("Failed to load dynamic SEO config for layout:", err);
  }

  const staticCapabilities = [
    "Specialized Domain Translation Focus (Legal, Medical, Financial, Technical, Academic)",
    "Interactive PDF and Document Layout Preservation Engine",
    "Personal Glossary and Vocabulary Management",
    "Real-time Text-to-Speech (TTS) voice generation",
    "Advanced Semantic & Linguistic Analysis",
    "Multimodal Scanned Document & OCR translation",
  ];
  const capabilities = dynamicCapabilities.length > 0 ? dynamicCapabilities : staticCapabilities;

  // Build a base SoftwareApplication + Organization schema. Per-page pages
  // (pricing, solutions/*) extend this with their own JSON-LD via Metadata API.
  const baseSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": getCanonicalUrl("/#organization"),
        name: SITE_NAME_AR,
        url: siteUrl,
        logo: getCanonicalUrl("/logo.png"),
        sameAs: [
          // Update with the real social profiles when known.
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": getCanonicalUrl("/#software"),
        name: "Tarjuman AI",
        alternateName: "ترجمان للترجمة الذكية",
        applicationCategory: "TranslationApplication",
        operatingSystem: "Web",
        description: "Professional AI-powered translation tool supporting text, files, and images across various specialized domains (legal, medical, financial, technical) with glossary terms, speech synthesis, and linguistic analysis.",
        url: siteUrl,
        publisher: { "@id": getCanonicalUrl("/#organization") },
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0.00",
            priceCurrency: "USD",
            category: "free",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "19.00",
            priceCurrency: "USD",
            category: "subscription",
            url: getCanonicalUrl("/pricing"),
          },
          {
            "@type": "Offer",
            name: "Enterprise",
            price: "49.00",
            priceCurrency: "USD",
            category: "subscription",
            url: getCanonicalUrl("/pricing"),
          },
        ],
        featureList: capabilities,
        author: { "@id": getCanonicalUrl("/#organization") },
      },
    ],
  };

  // Build the FAQPage schema. Prefer the auto-generated FAQ from the
  // seo-updater (refreshed every 24h). If none exists yet (cold start
  // before the scheduler fires), fall back to a small static set.
  const fallbackFaq = [
    {
      questionEn: "What is Tarjuman AI?",
      questionAr: "ما هي بوابة ترجمان للترجمة الذكية؟",
      answerEn: "Tarjuman is a web app that uses advanced AI models to provide contextual, specialised translation across medical, legal, engineering, and financial domains — preserving professional terminology and the approved linguistic register for each sector.",
      answerAr: "بوابة ترجمان هي تطبيق ويب يعتمد على نماذج الذكاء الاصطناعي المتطورة لتقديم ترجمة سياقية متخصصة في مجالات الطب والقانون والهندسة والمالية وغيرها، مع مراعاة المصطلحات المهنية الدقيقة والأسلوب اللغوي المعتمد لكل قطاع.",
    },
    {
      questionEn: "How does Tarjuman preserve PDF and document layout during translation?",
      questionAr: "كيف يتم الحفاظ على تنسيق ملفات PDF والمستندات أثناء الترجمة؟",
      answerEn: "Tarjuman analyses document structure programmatically and translates the content while preserving headings, spacing, punctuation, and tables — so you can download a print-ready document immediately.",
      answerAr: "يقوم نظام ترجمان بتحليل عناصر المستند برمجياً وترجمة المحتوى مع الاحتفاظ الدقيق بالهيكل والتنسيق والمسافات وعلامات الترقيم والجداول، مما يتيح لك تحميل مستند جاهز للطباعة مباشرة.",
    },
    {
      questionEn: "Does Tarjuman support scanned PDFs and image files?",
      questionAr: "هل تدعم منصة ترجمان ترجمة ملفات PDF الممسوحة ضوئياً أو المصورة؟",
      answerEn: "Yes. Tarjuman combines OCR (computer vision) with Gemini multimodal models to read, validate, and translate scanned documents and images end-to-end — without format conflicts.",
      answerAr: "نعم، تدعم منصة ترجمان ميزة الترجمة البصرية المباشرة للمستندات الممسوحة ضوئياً والصور؛ حيث يقوم النظام بدمج تقنية الرؤية الحاسوبية (OCR) مع نماذج Gemini المتعددة الوسائط لقراءة وتدقيق وترجمة الملف بالكامل بشكل مرئي ودون أي تعارضات.",
    },
    {
      questionEn: "How do I lock professional terminology in my translations?",
      questionAr: "كيف يمكنني تخصيص المصطلحات المهنية في ترجمة ترجمان؟",
      answerEn: "Use the Glossary tool to specify how particular words or phrases must be translated. The AI engine applies your locked terms across every translation and flags them in the result.",
      answerAr: "يمكنك استخدام أداة 'إدارة المصطلحات والقاموس' لتحديد معاني الكلمات أو العبارات المعينة التي ترغب في استخدامها بشكل صارم في ترجماتك، وسيقوم محرك الذكاء الاصطناعي بتطبيقها وتدقيق استخدامها تلقائياً.",
    },
  ];

  const faqSource = dynamicFaq.length > 0 ? dynamicFaq : fallbackFaq;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": getCanonicalUrl("/#faq"),
    dateModified: lastSeoUpdate || undefined,
    mainEntity: faqSource.map((f) => ({
      "@type": "Question",
      name: f.questionEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answerEn,
      },
    })),
  };

  // If the user supplied a fresh AEO description, surface it as a
  // WebSite-level JSON-LD so AI crawlers can find it from the homepage.
  const websiteSchema = dynamicAeoDescription
    ? {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": getCanonicalUrl("/#website"),
        url: siteUrl,
        name: SITE_NAME_AR,
        description: dynamicAeoDescription,
        inLanguage: ["ar", "en"],
        publisher: { "@id": getCanonicalUrl("/#organization") },
      }
    : null;

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        {websiteSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
        )}
      </head>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-500/10 selection:text-indigo-600">
        {children}
      </body>
    </html>
  );
}
