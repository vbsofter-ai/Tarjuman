export type LanguageCode =
  | "auto"
  | "ar"
  | "en"
  | "fr"
  | "es"
  | "de"
  | "it"
  | "tr"
  | "zh"
  | "ja"
  | "ru"
  | "pt"
  | "hi"
  | "ur";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

export type DomainCode =
  | "general"
  | "commercial"
  | "financial"
  | "legal"
  | "medical"
  | "technical"
  | "academic"
  | "literary"
  | "agricultural";

export interface DomainOption {
  code: DomainCode;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: string;
}

export type ToneCode = "formal" | "informal" | "professional" | "creative" | "academic";

export interface ToneOption {
  code: ToneCode;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}

export interface GlossaryTerm {
  id: string;
  source: string;
  target: string;
}

export interface FileData {
  name: string;
  size: number;
  mimeType: string;
  data: string; // Base64 representation
  extractedText?: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLang: string;
  linguisticAnalysis?: string;
  alternatives?: string[];
  glossaryApplied?: { source: string; target: string }[];
  detectionConfidence?: number;
  alternativeLanguages?: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  domain: DomainCode;
  tone: ToneCode;
  isFavorite: boolean;
  fileAttached?: {
    name: string;
    mimeType: string;
  };
  analysis?: string;
  alternatives?: string[];
  detectionConfidence?: number;
  alternativeLanguages?: string[];
}

export interface User {
  email: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  quotaUsed: number;
  quotaLimit: number; // in words
  role?: string;
  permissions?: string;
}

export interface PricingPlan {
  id: "free" | "pro" | "enterprise";
  nameAr: string;
  nameEn: string;
  priceMonthly: string;
  priceYearly: string;
  featuresAr: string[];
  featuresEn: string[];
  ctaAr: string;
  ctaEn: string;
  popular: boolean;
  limitDescAr: string;
  limitDescEn: string;
}

