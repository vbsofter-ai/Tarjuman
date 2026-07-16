/**
 * Centralized vertical/industry definitions for Tarjuman.
 *
 * Each vertical is its own SEO landing page under /solutions/<slug> with
 * a shared layout. Keeping this in one place lets us:
 *   1. Add a new vertical by appending a single entry
 *   2. Generate sitemap.xml entries automatically
 *   3. Share the same translation tuning (system prompt, glossary hints)
 *      between the marketing page and the /api/translate route
 */

export type VerticalSlug = "legal" | "medical" | "financial" | "technical" | "academic" | "commercial";

export interface VerticalDefinition {
  slug: VerticalSlug;
  /** Display name in English. */
  nameEn: string;
  /** Display name in Arabic. */
  nameAr: string;
  /** Tagline shown on the marketing page hero. */
  taglineEn: string;
  taglineAr: string;
  /** One-line value prop. */
  valuePropEn: string;
  valuePropAr: string;
  /** Marketing copy: 3-5 short bullets describing what makes this vertical special. */
  features: { en: string; ar: string }[];
  /** 3-5 sample terminology pairs to show on the page. */
  sampleTerms: { source: string; target: string; noteEn: string; noteAr: string }[];
  /** Hero icon name (lucide-react). */
  icon: "Scale" | "HeartPulse" | "TrendingUp" | "Cpu" | "GraduationCap" | "Briefcase";
  /** System prompt fragment used by /api/translate when this domain is selected. */
  systemPromptFragmentEn: string;
  systemPromptFragmentAr: string;
  /** Accent color (Tailwind class) used on the marketing page. */
  accent: "indigo" | "rose" | "emerald" | "amber" | "sky" | "slate";
}

export const VERTICALS: VerticalDefinition[] = [
  {
    slug: "legal",
    nameEn: "Legal Translation",
    nameAr: "الترجمة القانونية",
    taglineEn: "Court-grade translation for contracts, briefs and statutes",
    taglineAr: "ترجمة بمستوى المحاكم للعقود والمذكرات والتشريعات",
    valuePropEn:
      "Translate bilingual legal documents while preserving defined terms, clause numbering, and the exact register required by courts and regulators.",
    valuePropAr:
      "ترجمة المستندات القانونية ثنائية اللغة مع الحفاظ على المصطلحات المعرّفة، وترقيم البنود، والدقة اللغوية المطلوبة من المحاكم والجهات التنظيمية.",
    features: [
      {
        en: "Preserves defined terms, party names, and recitals verbatim across versions",
        ar: "يحافظ على المصطلحات المعرّفة، وأسماء الأطراف، والديباجات حرفياً بين الإصدارات",
      },
      {
        en: "Understands common-law and civil-law framing, jurisdiction-specific phrasing",
        ar: "يفهم صياغة القانون العام والمدني، والمصطلحات الخاصة بكل ولاية قضائية",
      },
      {
        en: "Citations, footnotes, and cross-references translated with full structure",
        ar: "ترجمة المراجع والحواشي والإحالات المتقاطعة مع الحفاظ على البنية الكاملة",
      },
      {
        en: "Side-by-side PDF / DOCX output with original layout intact",
        ar: "إخراج PDF / DOCX متقابل مع الحفاظ على التنسيق الأصلي",
      },
    ],
    sampleTerms: [
      { source: "Force Majeure", target: "القوة القاهرة", noteEn: "Civil-law concept", noteAr: "مفهوم القانون المدني" },
      { source: "Indemnification", target: "التعويض", noteEn: "Contractual clause", noteAr: "بند تعاقدي" },
      { source: "Severability", target: "قابلية الفصل", noteEn: "Contract law", noteAr: "قانون العقود" },
      { source: "Without prejudice", target: "دون المساس بالحقوق", noteEn: "Legal disclaimer", noteAr: "إخلاء مسؤولية قانوني" },
    ],
    icon: "Scale",
    systemPromptFragmentEn:
      "You are a senior legal translator. Use jurisdiction-aware terminology, preserve defined terms verbatim, keep clause numbering, and never paraphrase statutory language.",
    systemPromptFragmentAr:
      "أنت مترجم قانوني كبير. استخدم مصطلحات مراعية للولاية القضائية، وحافظ على المصطلحات المعرّفة حرفياً، وأبقِ على ترقيم البنود، ولا تصرّف صياغة النصوص التشريعية.",
    accent: "indigo",
  },
  {
    slug: "medical",
    nameEn: "Medical & Healthcare",
    nameAr: "الترجمة الطبية والصحية",
    taglineEn: "Precise medical, pharmaceutical, and clinical translations",
    taglineAr: "ترجمة طبية وصيدلانية وسريرية بدقة علمية عالية",
    valuePropEn:
      "Translate medical reports, clinical trials, package leaflets, and patient-facing materials with anatomy-grade terminology and FDA/EMA-friendly phrasing.",
    valuePropAr:
      "ترجمة التقارير الطبية والتجارب السريرية ونشرات الأدوية والمواد الموجهة للمرضى بمصطلحات علمية دقيقة متوافقة مع متطلبات FDA وEMA.",
    features: [
      {
        en: "INN drug names, ICD-10 / SNOMED CT codes preserved",
        ar: "الحفاظ على الأسماء الدولية للأدوية (INN) ورموز ICD-10 و SNOMED CT",
      },
      {
        en: "Recognizes lab values, dosage units, and contraindication framing",
        ar: "يتعرف على القيم المخبرية ووحدات الجرعات وصياغة موانع الاستعمال",
      },
      {
        en: "Patient-friendly plain language for leaflets, IFUs, discharge notes",
        ar: "صياغة مبسطة للمرضى للنشرات وإرشادات الاستخدام وملخصات الخروج",
      },
      {
        en: "Audit-trail ready — every glossary term is locked to your approved list",
        ar: "جاهز للتدقيق — كل مصطلح في القاموس مربوط بقائمتك المعتمدة",
      },
    ],
    sampleTerms: [
      { source: "Contraindication", target: "موانع الاستعمال", noteEn: "Drug safety", noteAr: "سلامة الدواء" },
      { source: "Adverse event", target: "الحدث الضار", noteEn: "Pharmacovigilance", noteAr: "اليقظة الدوائية" },
      { source: "Discharge summary", target: "ملخص الخروج", noteEn: "Clinical document", noteAr: "وثيقة سريرية" },
      { source: "Subcutaneous", target: "تحت الجلد", noteEn: "Route of administration", noteAr: "طريقة الإعطاء" },
    ],
    icon: "HeartPulse",
    systemPromptFragmentEn:
      "You are a medical translator. Use standardized clinical terminology, preserve INN drug names, never alter dosage or lab values, and adapt register for patient-facing vs. clinician-facing text.",
    systemPromptFragmentAr:
      "أنت مترم طبي. استخدم مصطلحات سريرية موحدة، وحافظ على الأسماء الدولية للأدوية، ولا تغير الجرعات أو القيم المخبرية، وكيّف السجل بين النصوص الموجهة للمرضى والنصوص الموجهة للأطباء.",
    accent: "rose",
  },
  {
    slug: "financial",
    nameEn: "Financial & Banking",
    nameAr: "الترجمة المالية والمصرفية",
    taglineEn: "IFRS, audit, and banking-grade financial translation",
    taglineAr: "ترجمة مالية ومصرفية وفق معايير IFRS والتدقيق",
    valuePropEn:
      "Translate annual reports, audit opinions, fund prospectuses and banking disclosures with figures intact and IFRS terminology consistent end-to-end.",
    valuePropAr:
      "ترجمة التقارير السنوية ورأي المدقق ونشرات الصناديق والإفصاحات المصرفية مع الحفاظ على الأرقام واستخدام مصطلحات IFRS بثبات.",
    features: [
      {
        en: "IFRS / GAAP terminology aligned with audited disclosure phrasing",
        ar: "مصطلحات IFRS / GAAP متوافقة مع صياغة الإفصاحات المدققة",
      },
      {
        en: "Numbers, percentages, and currency notation preserved exactly",
        ar: "الحفاظ على الأرقام والنسب المئوية ورموز العملات بدقة مطلقة",
      },
      {
        en: "Tables, schedules, and footnotes translated with structure intact",
        ar: "ترجمة الجداول والجداول الزمنية والحواشي مع الحفاظ على البنية",
      },
      {
        en: "Confidentiality-first workflow — no data leaves your tenant",
        ar: "سريّة أولاً — لا تغادر بياناتك بيئة العمل الخاصة بك",
      },
    ],
    sampleTerms: [
      { source: "Goodwill impairment", target: "انخفاض قيمة الشهرة", noteEn: "IFRS", noteAr: "IFRS" },
      { source: "Net Present Value", target: "القيمة الحالية الصافية", noteEn: "Finance", noteAr: "مالي" },
      { source: "Subordinated debt", target: "الدين الثانوي", noteEn: "Capital structure", noteAr: "هيكل رأس المال" },
      { source: "Earnings per share", target: "ربحية السهم", noteEn: "Reporting", noteAr: "التقارير المالية" },
    ],
    icon: "TrendingUp",
    systemPromptFragmentEn:
      "You are a financial translator. Use IFRS-aligned terminology, keep every number, percentage, and currency exactly as in the source, and never invent figures or dates.",
    systemPromptFragmentAr:
      "أنت مترم مالي. استخدم مصطلحات متوافقة مع IFRS، وحافظ على كل رقم ونسبة وعمولة كما هي في المصدر، ولا تخترع أرقاماً أو تواريخ.",
    accent: "emerald",
  },
  {
    slug: "technical",
    nameEn: "Technical & Engineering",
    nameAr: "الترجمة التقنية والهندسية",
    taglineEn: "Engineering manuals, software, and API docs — translated right",
    taglineAr: "ترجمة الأدلة الهندسية والبرمجيات ووثائق API بدقة",
    valuePropEn:
      "Translate product manuals, SDK reference, datasheets, and patents while keeping variable names, units, and code samples intact and runnable.",
    valuePropAr:
      "ترجمة الأدلة ووثائق SDK والبيانات الفنية وبراءات الاختراع مع الحفاظ على أسماء المتغيرات والوحدات وعينات الكود قابلة للتشغيل.",
    features: [
      {
        en: "Code blocks, CLI flags, and JSON/YAML keys are never translated",
        ar: "لا تُترجم كتل الكود ولا وسوم CLI ولا مفاتيح JSON / YAML",
      },
      {
        en: "Units (mm, kN, °C) and tolerances preserved with locale conventions",
        ar: "الحفاظ على الوحدات (ملم، كيلو نيوتن، °م) والتفاوتات المسموحة وفق العرف المحلي",
      },
      {
        en: "Manufacturer-specific glossary locking across all docs",
        ar: "قفل مسرد المصطلحات الخاص بالشركة المصنّعة عبر جميع الوثائق",
      },
      {
        en: "Side-by-side Markdown export for engineering review",
        ar: "تصدير Markdown متقابل للمراجعة الهندسية",
      },
    ],
    sampleTerms: [
      { source: "Torque", target: "عزم الدوران", noteEn: "Mechanical", noteAr: "ميكانيكا" },
      { source: "Form factor", target: "عامل الشكل", noteEn: "Hardware", noteAr: "عتاد" },
      { source: "Backward compatibility", target: "التوافقية العكسية", noteEn: "Software", noteAr: "برمجيات" },
      { source: "Yield strength", target: "مقاومة الخضوع", noteEn: "Materials", noteAr: "مواد" },
    ],
    icon: "Cpu",
    systemPromptFragmentEn:
      "You are a technical translator. Preserve every code identifier, CLI flag, unit, and number exactly. Translate only prose; never paraphrase error messages or API names.",
    systemPromptFragmentAr:
      "أنت مترم تقني. حافظ على كل معرّف كود ووسم CLI ووحدة ورقم كما هي. ترجم النص النثري فقط، ولا تصرّف صياغة رسائل الخطأ ولا أسماء واجهات API.",
    accent: "amber",
  },
  {
    slug: "academic",
    nameEn: "Academic & Research",
    nameAr: "الترجمة الأكاديمية والبحثية",
    taglineEn: "Scholarly translation for theses, papers, and grant proposals",
    taglineAr: "ترجمة أكاديمية للرسائل والأوراق العلمية ومقترحات المنح",
    valuePropEn:
      "Translate peer-review-grade scholarly writing with citation conventions, formal register, and discipline-aware terminology intact.",
    valuePropAr:
      "ترجمة الكتابة الأكاديمية بمستوى التحكيم مع الحفاظ على اصطلاحات الاقتباس والسجل الرصين والمصطلحات التخصصية لكل حقل.",
    features: [
      {
        en: "In-text citation styles (APA, Chicago, Harvard) preserved",
        ar: "الحفاظ على أنماط الاقتباس داخل النص (APA، شيكاغو، هارفارد)",
      },
      {
        en: "Discipline-aware terminology for sciences, humanities, and social sciences",
        ar: "مصطلحات مراعية للحقل المعرفي في العلوم والإنسانيات والعلوم الاجتماعية",
      },
      {
        en: "Abstracts, keywords, and metadata bilingual in a single file",
        ar: "الملخصات والكلمات المفتاحية والبيانات الوصفية ثنائية اللغة في ملف واحد",
      },
    ],
    sampleTerms: [
      { source: "Peer-reviewed", target: "محكّم من الأقران", noteEn: "Methodology", noteAr: "المنهجية" },
      { source: "Hypothesis", target: "الفرضية", noteEn: "Research", noteAr: "البحث" },
      { source: "Meta-analysis", target: "تحليل تلوي", noteEn: "Research method", noteAr: "منهج بحثي" },
    ],
    icon: "GraduationCap",
    systemPromptFragmentEn:
      "You are an academic translator. Use a formal scholarly register, preserve in-text citations and references exactly, and apply discipline-specific terminology.",
    systemPromptFragmentAr:
      "أنت مترم أكاديمي. استخدم سجلاً أكاديمياً رصيناً، وحافظ على الاقتباسات والمراجع داخل النص كما هي، وطبّق المصطلحات الخاصة بكل حقل معرفي.",
    accent: "sky",
  },
  {
    slug: "commercial",
    nameEn: "Commercial & Business",
    nameAr: "الترجمة التجارية",
    taglineEn: "Marketing, sales, and corporate communications that read native",
    taglineAr: "تسويق ومبيعات ومراسلات مؤسسية بأسلوب محلي طبيعي",
    valuePropEn:
      "Translate marketing copy, sales decks, and corporate comms that read natively in the target market — not literally, but persuasively.",
    valuePropAr:
      "ترجمة المواد التسويقية والعروض التقديمية والمراسلات المؤسسية بأسلوب طبيعي للسوق المستهدف — ليس حرفياً، بل مقنعاً.",
    features: [
      {
        en: "Transcreation: same message, native resonance",
        ar: "إعادة الإبداع: نفس الرسالة بروح محلية",
      },
      {
        en: "Brand voice and tone-of-voice locked to your style guide",
        ar: "تثبيت صوت العلامة وأسلوبها وفق دليل الأسلوب الخاص بك",
      },
      {
        en: "Localised calls-to-action, idioms, and cultural references",
        ar: "دعوات فعل ومراجع ثقافية محلية مفهومة",
      },
    ],
    sampleTerms: [
      { source: "Call to action", target: "دعوة لاتخاذ إجراء", noteEn: "Marketing", noteAr: "تسويق" },
      { source: "Onboarding", target: "تهيئة الاستخدام", noteEn: "Product", noteAr: "المنتج" },
      { source: "Thought leadership", target: "قيادة فكرية", noteEn: "B2B", noteAr: "أعمال" },
    ],
    icon: "Briefcase",
    systemPromptFragmentEn:
      "You are a commercial translator / transcreator. Adapt the message to feel native in the target language while preserving brand voice and CTA intent. Prefer natural idioms over literal calques.",
    systemPromptFragmentAr:
      "أنت مترم تجاري / مبدع محتوي. كيّف الرسالة لتكون طبيعية في اللغة المستهدفة مع الحفاظ على صوت العلامة والهدف من الدعوة لاتخاذ إجراء. فضّل التعابير الطبيعية على الترجمات الحرفية.",
    accent: "slate",
  },
];

export function getVertical(slug: string): VerticalDefinition | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}
