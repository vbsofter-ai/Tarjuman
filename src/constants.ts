import { Language, DomainOption, ToneOption } from "./types";

export const LANGUAGES: Language[] = [
  { code: "auto", name: "Auto Detect", nativeName: "كشف تلقائي", flag: "🌐", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", dir: "rtl" }
];

export const DOMAINS: DomainOption[] = [
  {
    code: "general",
    labelAr: "عامة",
    labelEn: "General",
    descAr: "للمحادثات اليومية والنصوص العامة بأسلوب بسيط وواضح",
    descEn: "For everyday conversations and generic texts. Simple and clear.",
    icon: "MessageSquare"
  },
  {
    code: "commercial",
    labelAr: "تجاري وتجارة إلكترونية",
    labelEn: "Commercial & Business",
    descAr: "للمراسلات التجارية والتسويق والأعمال بروح مهنية جذابة",
    descEn: "For business correspondence, marketing, and commercial use. Professional and persuasive.",
    icon: "Briefcase"
  },
  {
    code: "financial",
    labelAr: "مالي ومصرفي",
    labelEn: "Financial & Banking",
    descAr: "للتقارير المالية والمحاسبة والمصارف بدقة متناهية ومصطلحات معتمدة",
    descEn: "For financial reports, accounting, and banking. Extremely precise with standard jargon.",
    icon: "TrendingUp"
  },
  {
    code: "legal",
    labelAr: "قانوني وعقود",
    labelEn: "Legal & Contracts",
    descAr: "للاتفاقيات والوثائق الرسمية والقوانين بأسلوب رصين ومصطلحات قانونية صارمة",
    descEn: "For agreements, official documents, and laws. Highly formal with strict legal phrasing.",
    icon: "FileText"
  },
  {
    code: "medical",
    labelAr: "طبي ورعاية صحية",
    labelEn: "Medical & Healthcare",
    descAr: "للتقارير الطبية، الأدوية، والإرشادات الصحية بدقة علمية مخصصة",
    descEn: "For medical reports, pharmacy, and health guides. High scientific accuracy.",
    icon: "Heart"
  },
  {
    code: "technical",
    labelAr: "تقني وهندسي",
    labelEn: "Technical & Engineering",
    descAr: "للأدلة الهندسية، البرمجيات، والمصطلحات التقنية المتخصصة بدقة عالية",
    descEn: "For engineering manuals, software, and specialised technical terminology.",
    icon: "Cpu"
  },
  {
    code: "academic",
    labelAr: "أكاديمي وعلمي",
    labelEn: "Academic & Research",
    descAr: "للأبحاث العلمية والأوراق الدراسية بلغة رصينة ومحايدة وموثقة",
    descEn: "For research papers and scholarly work. Objective and authoritative language.",
    icon: "GraduationCap"
  },
  {
    code: "literary",
    labelAr: "أدبي وإبداعي",
    labelEn: "Literary & Creative",
    descAr: "للروايات، القصص والشعر مع الحفاظ على المعاني المجازية والبعد الجمالي",
    descEn: "For novels, stories, and poetry. Preserves metaphors and aesthetic feeling.",
    icon: "PenTool"
  },
  {
    code: "agricultural",
    labelAr: "زراعي وبيئي",
    labelEn: "Agricultural",
    descAr: "لعلوم الزراعة والمحاصيل وإدارة التربة والري بعبارات ومصطلحات متخصصة",
    descEn: "For agricultural science, crop management, soil, and irrigation terminology.",
    icon: "Sprout"
  }
];

export const TONES: ToneOption[] = [
  {
    code: "formal",
    labelAr: "رسمي",
    labelEn: "Formal",
    descAr: "أسلوب فصيح وموقر يخلو من العبارات الودية الزائدة",
    descEn: "Polite and dignified, avoids excessive colloquialisms."
  },
  {
    code: "informal",
    labelAr: "ودي/بسيط",
    labelEn: "Informal",
    descAr: "أسلوب ودي وقريب، كحديث بين الأصدقاء بطلاقة وعفوية",
    descEn: "Friendly, casual, and natural. Conversational."
  },
  {
    code: "professional",
    labelAr: "مهني وعملي",
    labelEn: "Professional",
    descAr: "أسلوب متزن وواضح ومناسب لبيئة العمل التنفيذية",
    descEn: "Balanced, executive, and business-focused."
  },
  {
    code: "creative",
    labelAr: "إبداعي/بلاغي",
    labelEn: "Creative",
    descAr: "أسلوب فني يركز على الوقع البلاغي واختيار الألفاظ الرنانة",
    descEn: "Expressive, artistic, focuses on stylistic impact."
  },
  {
    code: "academic",
    labelAr: "علمي متزن",
    labelEn: "Academic",
    descAr: "أسلوب تحليلي هادئ مبني على صيغ المجهول والموضوعية المطلقة",
    descEn: "Analytical, scholarly, objective, and authoritative."
  }
];

export const SAMPLE_TEXTS: Record<string, string> = {
  ar: "يُعتبر الذكاء الاصطناعي التوليدي من أهم القفزات التكنولوجية في العصر الحديث. فهو لا يقتصر على أتمتة المهام فحسب، بل يمتد إلى تمكين الإنسان من ابتكار حلول جديدة ومبتكرة في شتى المجالات كالطب، والهندسة، والزراعة الرقمية، مما يمهد الطريق لمستقبل أكثر ازدهاراً واستدامة.",
  en: "Generative artificial intelligence is considered one of the most significant technological leaps of the modern era. It is not limited to mere automation of tasks, but extends to enabling humans to innovate novel solutions across various domains such as medicine, engineering, and digital agriculture, paving the way for a more prosperous and sustainable future.",
  fr: "L'intelligence artificielle générative est considérée comme l'un des sauts technologiques les plus importants de l'ère moderne. Elle ne se limite pas à la simple automatisation des tâches, mais permet à l'homme d'innover de nouvelles solutions.",
  es: "La inteligencia artificial generativa se considera uno de los saltos tecnológicos más significativos de la era moderna."
};

export const PRICING_PLANS: any[] = [
  {
    id: "free",
    nameAr: "الباقة المجانية",
    nameEn: "Free Plan",
    priceMonthly: "0$",
    priceYearly: "0$",
    limitDescAr: "5,000 كلمة شهرياً",
    limitDescEn: "5,000 words per month",
    featuresAr: [
      "ترجمة النصوص الأساسية من وإلى 14 لغة",
      "كشف تلقائي للغات المدخلة",
      "إدخال صوتي وقراءة صوتية أساسية",
      "إضافة حتى 3 مصطلحات في القاموس المخصص",
      "سجل العمليات الأخير (حتى 5 عمليات)"
    ],
    featuresEn: [
      "Basic text translation in 14 languages",
      "Auto-detect input language",
      "Voice dictation and basic text-to-speech",
      "Add up to 3 custom terms in the glossary",
      "Recent translation history (last 5 items)"
    ],
    ctaAr: "ابدأ مجاناً",
    ctaEn: "Get Started",
    popular: false
  },
  {
    id: "pro",
    nameAr: "الباقة الاحترافية Pro",
    nameEn: "Pro Professional",
    priceMonthly: "$19",
    priceYearly: "$149",
    limitDescAr: "100,000 كلمة شهرياً",
    limitDescEn: "100,000 words per month",
    featuresAr: [
      "كل مميزات الباقة المجانية",
      "تجربة خالية تماماً من الإعلانات (بدون إعلانات)",
      "ترجمة الملفات والصور (PDF, Document, Images)",
      "تحميل الملف المترجم بنفس التنسيق تماماً",
      "مساعد ترجمان اللغوي المتقدم (تحليل المصطلحات والبلاغة)",
      "قاموس مصطلحات غير محدود لتثبيت معاني كلماتك المخصصة",
      "خيارات صياغة بديلة متعددة ومتقدمة",
      "دعم فني متميز على مدار الساعة"
    ],
    featuresEn: [
      "Everything in Free Plan",
      "100% Ad-free experience",
      "Translate files and images (PDF, Doc, Images)",
      "Download translated file with exact layout preserved",
      "Advanced Linguistic Insights Assistant",
      "Unlimited custom glossary terms",
      "Multiple advanced alternative phrasings",
      "24/7 Priority email support"
    ],
    ctaAr: "اشترك الآن",
    ctaEn: "Upgrade to Pro",
    popular: true
  },
  {
    id: "enterprise",
    nameAr: "باقة الشركات والاعمال",
    nameEn: "Enterprise Master",
    priceMonthly: "$49",
    priceYearly: "$399",
    limitDescAr: "كلمات غير محدودة شهرياً",
    limitDescEn: "Unlimited words per month",
    featuresAr: [
      "كل مميزات الباقة الاحترافية Pro",
      "ترجمة مستندات جماعية وبأحجام غير محدودة",
      "لوحة تحكم خاصة للفريق وحصص استخدام مشتركة",
      "تكامل مخصص مع أنظمة ERP وسير العمل للشركات",
      "إتاحة نماذج ذكاء اصطناعي خاصة بدقة أعلى ومخصصة لقطاعك",
      "مدير حساب مخصص وتدريب للموظفين",
      "ضمان مستويات الخدمة (SLA) بنسبة 99.9%"
    ],
    featuresEn: [
      "Everything in Pro Plan",
      "Bulk document translation with no size limits",
      "Team administration dashboard & shared quotas",
      "Custom ERP & Enterprise API integrations",
      "Access to highly fine-tuned industry-specific models",
      "Dedicated account manager & staff training",
      "99.9% Service Level Agreement (SLA) guarantee"
    ],
    ctaAr: "تواصل معنا",
    ctaEn: "Contact Sales",
    popular: false
  }
];

