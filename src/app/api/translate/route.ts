import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { getGeminiClient, callWithRetry } from "@/src/lib/gemini";
import { getUserByEmail, logAction, updateUserQuota } from "@/src/lib/server-db";
import { getVertical } from "@/src/lib/verticals";

const LANGUAGE_NAMES: Record<string, string> = {
  auto: "Auto Detect",
  ar: "Arabic (العربية)",
  en: "English",
  fr: "French (Français)",
  es: "Spanish (Español)",
  de: "German (Deutsch)",
  it: "Italian (Italiano)",
  tr: "Turkish (Türkçe)",
  zh: "Chinese (中文)",
  ja: "Japanese (日本語)",
  ru: "Russian (Русский)",
  pt: "Portuguese (Português)",
  hi: "Hindi (हिन्दी)",
  ur: "Urdu (اردو)"
};

const DOMAIN_CONTEXTS: Record<string, string> = {
  general: "General daily conversation, clear and standard translation.",
  commercial: "Business, marketing, trade, and commercial correspondence. Professional, polite, and persuasive.",
  financial: "Finance, banking, investment, stock market, and accounting. Extremely precise, using correct banking and financial jargon.",
  legal: "Contracts, terms of service, laws, legal briefs, and certificates. Highly formal, exact, using standard legal phrasing and syntax.",
  medical: "Healthcare, pharmacy, clinical reports, and anatomy. Extremely accurate, avoiding slang, using standard medical terminology.",
  technical: "Engineering, software, construction, hardware, and science. Clear, descriptive, and technical, using accurate industry terminology.",
  academic: "Scientific research papers, theses, citations, and university lectures. Highly formal, objective, and scholarly.",
  literary: "Novels, stories, poems, and creative writing. Artistic, eloquent, preserving metaphors, rhymes, and the emotional tone of the source.",
  agricultural: "Agriculture, farming, crop management, soil science, irrigation, and livestock. Accurate, using agricultural and environmental terminology."
};

const TONE_CONTEXTS: Record<string, string> = {
  formal: "Formal and highly polite. Avoid colloquialisms.",
  informal: "Casual, friendly, and natural. Sounds like a native talking to a friend.",
  professional: "Polite, business-like, objective, and executive.",
  creative: "Lively, engaging, stylistic, and expressive.",
  academic: "Scholarly, authoritative, detailed, and passive-voiced where appropriate."
};

/**
 * Domain → Gemini model.
 *
 * Specialised domains (legal, medical, financial, technical, academic) get the
 * higher-quality Pro model because the willingness-to-pay for these verticals
 * is high and a mistranslation is a real cost (legal liability, patient
 * safety, audit risk). General / commercial / literary / agricultural
 * translation uses the cheaper Flash model — the cost savings on these
 * high-volume, low-margin requests directly fund the Pro spend on the
 * specialised ones.
 *
 * Override via env (e.g. set GEMINI_MODEL=gemini-2.5-pro to force Pro for
 * all traffic during a regression test).
 */
const SPECIALIZED_DOMAINS = new Set([
  "legal",
  "medical",
  "financial",
  "technical",
  "academic",
]);

const DEFAULT_MODEL = process.env.GEMINI_MODEL
  ? String(process.env.GEMINI_MODEL)
  : "gemini-flash-latest";
// 2026 update: gemini-2.5-pro is on the free tier with limit 0 for
// most AI Studio keys. We default to the same Flash model the
// general tier uses, so the system still works on free keys. Paid
// deployments can override via GEMINI_SPECIALIZED_MODEL=gemini-2.5-pro.
const SPECIALIZED_MODEL = process.env.GEMINI_SPECIALIZED_MODEL
  ? String(process.env.GEMINI_SPECIALIZED_MODEL)
  : "gemini-flash-latest";

function pickModelForDomain(domain: string): { model: string; tier: "flash" | "pro" } {
  if (SPECIALIZED_DOMAINS.has(domain)) {
    return { model: SPECIALIZED_MODEL, tier: "pro" };
  }
  return { model: DEFAULT_MODEL, tier: "flash" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      text,
      sourceLang = "auto",
      targetLang = "en",
      domain = "general",
      tone = "formal",
      glossary = [],
      file,
      email
    } = body;

    // Check word count and verify user limits
    let wordCount = 0;
    if (text) {
      wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    } else if (file && file.extractedText) {
      wordCount = file.extractedText.trim().split(/\s+/).filter(Boolean).length;
    }

    if (email) {
      const dbUser = await getUserByEmail(email);
      if (dbUser) {
        if (dbUser.status === "suspended") {
          return NextResponse.json({
            error: "تم تجميد حسابك مؤقتاً بسبب تجاوز معايير الاستخدام. يرجى مراجعة الإدارة.",
            technicalDetails: "Account is suspended by administrator."
          }, { status: 403 });
        }
        if (dbUser.quotaUsed + wordCount > dbUser.quotaLimit) {
          return NextResponse.json({
            error: "لقد تجاوزت الحصة المحددة لحسابك هذا الشهر. يرجى ترقية باقتك للاستمرار بالترجمة الفورية.",
            technicalDetails: "User word limit quota exceeded."
          }, { status: 403 });
        }
      }
    }

    const ai = getGeminiClient();

    const srcLangName = LANGUAGE_NAMES[sourceLang] || sourceLang;
    const destLangName = LANGUAGE_NAMES[targetLang] || targetLang;
    const domainDesc = DOMAIN_CONTEXTS[domain] || DOMAIN_CONTEXTS.general;
    const toneDesc = TONE_CONTEXTS[tone] || TONE_CONTEXTS.formal;

    // Build system instructions
    // We add the vertical-specific fragment from verticals.ts when the
    // domain maps to one of our marketing verticals (legal/medical/financial/
    // technical/academic/commercial). This locks terminology, register,
    // and what NOT to do for high-stakes translations.
    const vertical = getVertical(domain);

    let systemInstruction = `You are "Tarjuman AI" (ترجمان), a world-class professional translator and linguistic expert with absolute native fluency in both the source and target languages.
Your goal is to translate the source text/file content with extreme accuracy, high readability, and cultural sensitivity.

Specific Guidelines:
1. Target Language: Translate into ${destLangName}.
2. Source Language: If the input language is specified as ${srcLangName}, translate from it. If "Auto Detect" is specified, automatically detect the source language and output its code/name in the 'detectedLang' field.
3. Specialized Domain: The translation is for a '${domain}' audience. ${domainDesc}
4. Stylistic Tone: Maintain a '${tone}' tone. ${toneDesc}
5. Format and Layout: Retain structural elements such as paragraph divisions and standard spacing in your translated output.${vertical ? "\n" + vertical.systemPromptFragmentEn : ""}

Language Detection & Confidence Guidelines:
- For language detection, determine a confidence score between 0.0 and 1.0 and specify it in the 'detectionConfidence' field.
- If the source text is short, highly ambiguous, contains dialects, or contains mixed languages, the confidence score should reflect this and be low (e.g., 0.2 to 0.7). If the text is clear, standard, and sufficiently long, the confidence should be high (e.g., 0.9 to 1.0).
- If the confidence score is below 0.85, you MUST suggest 1 or 2 possible alternative source language ISO codes or names in the 'alternativeLanguages' array (e.g., if you detect French with low confidence, alternatives might be Spanish 'es' or Italian 'it'). If you are highly confident (0.85+), 'alternativeLanguages' should be an empty array [].
`;

    if (glossary && glossary.length > 0) {
      systemInstruction += `\n6. Glossary Rules: You MUST strictly adhere to the following terminology map. If any of these source terms appear in the source text, translate them exactly as specified:
${glossary.map((g: any) => `- "${g.source}" must be translated as "${g.target}"`).join("\n")}
Ensure that if these terms are used, you mention them in the 'glossaryApplied' field of your response JSON.`;
    }

    let userPrompt = "";
    const parts: any[] = [];

    if (file && file.data) {
      if (file.extractedText === "Scanned Document (AI Vision/OCR Translation Mode)") {
        // Scanned PDF: send document directly as multimodal input to Gemini
        parts.push({
          inlineData: {
            mimeType: file.mimeType || "application/pdf",
            data: file.data
          }
        });
        userPrompt = `Please read this scanned PDF file, perform OCR, and translate it into ${destLangName}. Maintain the visual formatting, paragraph structure, alignment, and original layout exactly.`;
        parts.push({ text: userPrompt });
      } else {
        // Standard PDF with text already extracted: translate extracted text directly
        userPrompt = `Please translate the following text extracted from the file "${file.name}" into ${destLangName}. Keep any spacing, list formatting, and layout structure intact in the translation:\n\n${file.extractedText}`;
        parts.push({ text: userPrompt });
      }
    } else if (text) {
      userPrompt = `Please translate this text into ${destLangName}:\n\n${text}`;
      parts.push({ text: userPrompt });
    } else {
      return NextResponse.json({ error: "No text or file content provided for translation" }, { status: 400 });
    }

    const { model: selectedModel, tier: modelTier } = pickModelForDomain(domain);

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: selectedModel,
        contents: parts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          // Explicit token budget — without this, the model can decide
          // to spend most of its output on schema validation rather
          // than the actual translation, which is the most common
          // cause of mid-word truncation (e.g. "good" → "جد" instead
          // of "جيد"). 8K is enough for ~3,000-word translations.
          maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || "8192", 10),
          // Lower temperature = more deterministic, faster, and less
          // likely to add extra prose that the schema can't fit.
          temperature: 0.3,
          topP: 0.9,
          topK: 40,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: {
                type: Type.STRING,
                description: "The final translated text. Must be a complete, non-truncated translation of the source. Preserve every sentence, paragraph break, and formatting marker from the source.",
              },
              detectedLang: { type: Type.STRING, description: "The ISO 639-1 code of the detected source language (e.g. 'ar', 'fr', 'en')." },
              detectionConfidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0." },
              alternativeLanguages: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "ISO codes of alternative possible languages if confidence is low.",
              },
              glossaryApplied: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of glossary source terms successfully applied in the translation.",
              },
              linguisticNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Brief notes on grammatical, stylistic, cultural choices or terminology nuance.",
              },
            },
            required: ["translatedText", "detectedLang", "detectionConfidence"],
          },
        },
      })
    );

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty translation response from Gemini API");
    }

    let translationResult: any;
    try {
      translationResult = JSON.parse(jsonText);
    } catch (parseErr: any) {
      // The model sometimes returns the JSON inside a code fence despite
      // responseMimeType being set. Try to extract the JSON substring.
      const m = jsonText.match(/\{[\s\S]*\}/);
      if (m) {
        translationResult = JSON.parse(m[0]);
      } else {
        throw new Error(`Translation response was not valid JSON: ${parseErr?.message}`);
      }
    }

    // Sanity check: translatedText must exist and be a non-trivial
    // string. If the model returned something nonsensical, fall back
    // to using the raw text so the user at least gets SOMETHING.
    if (!translationResult.translatedText || typeof translationResult.translatedText !== "string") {
      console.warn("[Translate] translatedText missing or non-string in response, falling back to raw text");
      translationResult.translatedText = jsonText;
    }
    // Attach the model we used so the client (and the analytics row) can
    // see which tier served this request.
    (translationResult as any).modelTier = modelTier;
    (translationResult as any).modelUsed = selectedModel;

    // Update quota and log in MySQL
    if (email) {
      await updateUserQuota(email, wordCount);
      const directionStr = `${sourceLang} -> ${targetLang}`;
      await logAction(
        "Translation Request",
        "success",
        `User ${email} - Domain: ${domain} (${directionStr}, ${modelTier}/${selectedModel}) - ${wordCount} words`
      );
    }

    return NextResponse.json(translationResult);
  } catch (error: any) {
    console.error("Translation API error:", error);
    
    const errorStatus = error?.status;
    const errorMessage = String(error?.message || "").toUpperCase();
    
    const isUnavailable = 
      errorStatus === 503 || 
      errorMessage.includes("503") || 
      errorMessage.includes("UNAVAILABLE") || 
      errorMessage.includes("TEMPORARY") || 
      errorMessage.includes("DEMAND") || 
      errorMessage.includes("BUSY") || 
      errorMessage.includes("OVERLOAD");

    const isQuota = 
      errorStatus === 429 || 
      errorMessage.includes("429") || 
      errorMessage.includes("RESOURCE_EXHAUSTED") || 
      errorMessage.includes("LIMIT");

    let friendlyError = "حدث خطأ غير متوقع أثناء الترجمة. يرجى المحاولة مرة أخرى.";
    if (isUnavailable) {
      friendlyError = "خدمة الذكاء الاصطناعي تعاني من ضغط مؤقت في الطلبات (عبر السيرفر). يرجى الانتظار بضع ثوانٍ وإعادة المحاولة بالضغط على زر الترجمة.";
    } else if (isQuota) {
      friendlyError = "تم تجاوز حد الطلبات المتزامنة المسموح به مؤقتاً. يرجى الانتظار نصف دقيقة والمحاولة مرة أخرى.";
    }

    return NextResponse.json({ 
      error: friendlyError,
      technicalDetails: error.message || "An error occurred during translation" 
    }, { status: 500 });
  }
}
