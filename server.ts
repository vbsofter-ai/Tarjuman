import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  initializeDatabase,
  getUsers,
  getUserByEmail,
  createUser,
  updateUser,
  updateUserQuota,
  updateLastActive,
  updateUserStatus,
  getSystemConfig,
  updateSystemConfig,
  getLogs,
  logAction,
  deleteUser
} from "./server-db";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload size to accommodate base64-encoded files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy init of Gemini API Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please configure it in your Secrets/Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Utility to call Gemini API with automatic exponential retry on transient network/overload errors
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorStatus = error?.status;
      const errorMessage = String(error?.message || "").toUpperCase();
      
      const isTransient = 
        errorStatus === 503 || 
        errorStatus === 429 ||
        errorMessage.includes("503") || 
        errorMessage.includes("429") ||
        errorMessage.includes("UNAVAILABLE") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("TEMPORARY") ||
        errorMessage.includes("DEMAND") ||
        errorMessage.includes("OVERLOAD") ||
        errorMessage.includes("BUSY");

      if (isTransient && attempt < retries) {
        console.warn(`[Gemini API] Request failed with transient status/message. Retrying in ${delayMs}ms... (Attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2.5; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

// Language mapping names for display in prompts
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

// Domain mapping explanations
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

// Tone context guidelines
const TONE_CONTEXTS: Record<string, string> = {
  formal: "Formal and highly polite. Avoid colloquialisms.",
  informal: "Casual, friendly, and natural. Sounds like a native talking to a friend.",
  professional: "Polite, business-like, objective, and executive.",
  creative: "Lively, engaging, stylistic, and expressive.",
  academic: "Scholarly, authoritative, detailed, and passive-voiced where appropriate."
};

// Translate API
app.post("/api/translate", async (req: any, res: any) => {
  try {
    const {
      text,
      sourceLang = "auto",
      targetLang = "en",
      domain = "general",
      tone = "formal",
      glossary = [],
      file,
      email
    } = req.body;

    // Check word count and verify user limits in MySQL
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
          return res.status(403).json({
            error: "تم تجميد حسابك مؤقتاً بسبب تجاوز معايير الاستخدام. يرجى مراجعة الإدارة.",
            technicalDetails: "Account is suspended by administrator."
          });
        }
        if (dbUser.quotaUsed + wordCount > dbUser.quotaLimit) {
          return res.status(403).json({
            error: "لقد تجاوزت الحصة المحددة لحسابك هذا الشهر. يرجى ترقية باقتك للاستمرار بالترجمة الفورية.",
            technicalDetails: "User word limit quota exceeded."
          });
        }
      }
    }

    const ai = getGeminiClient();

    const srcLangName = LANGUAGE_NAMES[sourceLang] || sourceLang;
    const destLangName = LANGUAGE_NAMES[targetLang] || targetLang;
    const domainDesc = DOMAIN_CONTEXTS[domain] || DOMAIN_CONTEXTS.general;
    const toneDesc = TONE_CONTEXTS[tone] || TONE_CONTEXTS.formal;

    // Build the system instructions and user prompt
    let systemInstruction = `You are "Tarjuman AI" (ترجمان), a world-class professional translator and linguistic expert with absolute native fluency in both the source and target languages.
Your goal is to translate the source text/file content with extreme accuracy, high readability, and cultural sensitivity.

Specific Guidelines:
1. Target Language: Translate into ${destLangName}.
2. Source Language: If the input language is specified as ${srcLangName}, translate from it. If "Auto Detect" is specified, automatically detect the source language and output its code/name in the 'detectedLang' field.
3. Specialized Domain: The translation is for a '${domain}' audience. ${domainDesc}
4. Stylistic Tone: Maintain a '${tone}' tone. ${toneDesc}
5. Format and Layout: Retain structural elements such as paragraph divisions and standard spacing in your translated output.

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

    if (file && file.extractedText) {
      userPrompt = `Please translate the following text extracted from the file "${file.name}" into ${destLangName}. Keep any spacing, list formatting, and layout structure intact in the translation:\n\n${file.extractedText}`;
    } else if (file && file.data && file.mimeType) {
      // Add the file as inline data for multimodal processing
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
      userPrompt = `Analyze the attached file and extract its core text. Translate its contents completely and accurately to ${destLangName}. Preserve any headers, lists, or structural layouts in the translated text.`;
    } else {
      userPrompt = `Please translate the following text into ${destLangName}:\n\n${text}`;
    }

    parts.push({ text: userPrompt });

    // Define the JSON schema for translation results
    const translationSchema = {
      type: Type.OBJECT,
      properties: {
        translatedText: {
          type: Type.STRING,
          description: "The complete translated text, preserving paragraphs, structural elements, and formatting.",
        },
        detectedLang: {
          type: Type.STRING,
          description: "The ISO language code or name of the detected source language (e.g., 'ar' for Arabic, 'en' for English).",
        },
        detectionConfidence: {
          type: Type.NUMBER,
          description: "A confidence score between 0.0 and 1.0 representing how confident you are in the detected source language.",
        },
        alternativeLanguages: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "An array of 1 or 2 possible alternative language codes or names if source language detection confidence is low (< 0.85). Keep empty if highly confident.",
        },
        linguisticAnalysis: {
          type: Type.STRING,
          description: "A detailed, professional linguistic analysis in the UI language (or Arabic if the source is Arabic/English). Explain key specialized terminology choices, difficult idioms translated, grammar considerations, and subtle cultural nuances.",
        },
        alternatives: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "An array of 2 or 3 alternative translations of the text/file with slight variation in styles (e.g. more literal, shorter, or more colloquial).",
        },
        glossaryApplied: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              target: { type: Type.STRING },
            }
          },
          description: "List of glossary rules that were successfully matched and applied in the final translation."
        }
      },
      required: ["translatedText", "detectedLang", "detectionConfidence", "alternativeLanguages", "linguisticAnalysis", "alternatives"]
    };

    const response = await callWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: parts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: translationSchema,
          temperature: 0.2, // Lower temperature for high-fidelity translation
        }
      })
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from translation model");
    }

    const result = JSON.parse(responseText.trim());

    // Update user quota used and insert transaction logs in the MySQL DB
    if (email) {
      await updateUserQuota(email, wordCount);
      await updateLastActive(email);
      await logAction(
        "Translation Request",
        "success",
        `User ${email} - ${domain} (${sourceLang === "auto" ? (result.detectedLang || "auto") : sourceLang} -> ${targetLang}) - ${wordCount} words`
      );
    } else {
      await logAction(
        "Guest Translation",
        "info",
        `Guest translation - ${domain} (${sourceLang === "auto" ? (result.detectedLang || "auto") : sourceLang} -> ${targetLang}) - ${wordCount} words`
      );
    }

    res.json(result);

  } catch (error: any) {
    console.error("Translation error:", error);
    
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

    res.status(500).json({ 
      error: friendlyError,
      technicalDetails: error.message || "An error occurred during translation" 
    });
  }
});

// Text-to-Speech (TTS) API
app.post("/api/tts", async (req: any, res: any) => {
  try {
    const { text, lang = "en" } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required for speech synthesis" });
    }

    const ai = getGeminiClient();

    // Map language to a speaker/voice or instruction
    let voice = "Zephyr"; // Zephyr, Fenrir, Kore, Charon, Puck
    let promptInstruction = `Synthesize the following text in a natural, clear voice: "${text}"`;

    // Suggest appropriate prebuilt voices based on the language
    if (lang === "ar") {
      voice = "Kore"; // Warm, clear
      promptInstruction = `Synthesize this Arabic text with correct diacritics and professional native accent: "${text}"`;
    } else if (lang === "fr") {
      voice = "Charon";
      promptInstruction = `Synthesize this French text with correct native accent: "${text}"`;
    } else if (lang === "es") {
      voice = "Fenrir";
      promptInstruction = `Synthesize this Spanish text with correct native accent: "${text}"`;
    } else if (lang === "de") {
      voice = "Puck";
      promptInstruction = `Synthesize this German text with correct native accent: "${text}"`;
    }

    const response = await callWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptInstruction }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio content returned from speech synthesis model");
    }

    res.json({ audio: base64Audio });

  } catch (error: any) {
    console.error("TTS error:", error);
    
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

    let friendlyError = "حدث خطأ غير متوقع أثناء تركيب الصوت التلقائي. يرجى المحاولة مرة أخرى بعد قليل.";
    if (isUnavailable) {
      friendlyError = "الخادم يعاني من ضغط مؤقت في معالجة الصوت الفوري. يرجى الانتظار بضع ثوانٍ ثم الضغط على زر الاستماع مرة أخرى.";
    }

    res.status(500).json({ 
      error: friendlyError,
      technicalDetails: error.message || "An error occurred during speech synthesis"
    });
  }
});

// Real Authentication endpoint
app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUser({
        id: `usr-${Date.now()}`,
        name: name || email.split("@")[0],
        email: email,
        plan: "free",
        quotaLimit: 5000,
        preferredDomain: "general"
      });
      await logAction("User Registration", "info", `New user registered: ${email}`);
    } else {
      await updateLastActive(email);
      await logAction("User Login", "success", `User logged in: ${email}`);
    }

    res.json(user);
  } catch (error: any) {
    console.error("Auth error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all users
app.get("/api/admin/users", async (req: any, res: any) => {
  try {
    const usersList = await getUsers();
    res.json(usersList);
  } catch (error: any) {
    console.error("Admin getUsers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Toggle user status
app.post("/api/admin/users/status", async (req: any, res: any) => {
  try {
    const { id, status } = req.body;
    await updateUserStatus(id, status);
    const usersList = await getUsers() as any;
    const affectedUser = usersList.find((u: any) => u.id === id);
    if (affectedUser) {
      await logAction("User Status Changed", status === "suspended" ? "warning" : "info", `Admin changed status of ${affectedUser.email} to ${status}`);
    }
    res.json(usersList);
  } catch (error: any) {
    console.error("Admin updateStatus error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update user profile
app.post("/api/admin/users/update", async (req: any, res: any) => {
  try {
    const { id, name, email, plan, quotaUsed, quotaLimit, status, role, permissions } = req.body;
    await updateUser({ id, name, email, plan, quotaUsed, quotaLimit, status, role, permissions });
    await logAction("User Profile Updated", "success", `Modified profile/quota/role for ${email}`);
    const usersList = await getUsers();
    res.json(usersList);
  } catch (error: any) {
    console.error("Admin updateUser error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete user
app.post("/api/admin/users/delete", async (req: any, res: any) => {
  try {
    const { id } = req.body;
    const usersListBefore = await getUsers() as any;
    const deletedUser = usersListBefore.find((u: any) => u.id === id);
    const deletedEmail = deletedUser ? deletedUser.email : id;

    await deleteUser(id);
    await logAction("User Deleted", "warning", `Admin deleted user account: ${deletedEmail}`);
    const usersList = await getUsers();
    res.json(usersList);
  } catch (error: any) {
    console.error("Admin deleteUser error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create user manually
app.post("/api/admin/users/create", async (req: any, res: any) => {
  try {
    const { name, email, plan, quotaLimit, preferredDomain, role, permissions } = req.body;
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    await createUser({
      id: `usr-${Date.now()}`,
      name,
      email,
      plan,
      quotaLimit,
      preferredDomain,
      role,
      permissions
    });
    await logAction("User Created Manually", "success", `Admin registered user account: ${email} with role: ${role || 'user'}`);
    const usersList = await getUsers();
    res.json(usersList);
  } catch (error: any) {
    console.error("Admin createUser error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get system configuration
app.get("/api/admin/config", async (req: any, res: any) => {
  try {
    const config = await getSystemConfig();
    res.json(config);
  } catch (error: any) {
    console.error("Admin getConfig error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update system configuration
app.post("/api/admin/config", async (req: any, res: any) => {
  try {
    const config = req.body;
    await updateSystemConfig(config);
    await logAction("System Config Updated", "info", `Admin modified global system parameters`);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin updateConfig error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get transaction logs
app.get("/api/admin/logs", async (req: any, res: any) => {
  try {
    const logsList = await getLogs();
    res.json(logsList);
  } catch (error: any) {
    console.error("Admin getLogs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function start() {
  // Initialize MySQL Database connection and create tables if not exists
  await initializeDatabase();

  // Vite dev server vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
