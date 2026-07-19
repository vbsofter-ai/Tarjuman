import { NextResponse } from "next/server";
import { getGeminiClient, callWithRetry } from "@/src/lib/gemini";
import { getSystemConfig } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, lang = "en" } = body;
    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Text is required for speech synthesis" }, { status: 400 });
    }

    // Map language to a speaker/voice or instruction
    let voice = "Zephyr"; // Zephyr, Fenrir, Kore, Charon, Puck
    let promptInstruction = `Synthesize the following text in a natural, clear voice: "${text}"`;

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

    // Fetch active system config to load dynamic keys from DB
    const systemConfig = await getSystemConfig().catch(() => null);

    if (systemConfig?.maintenanceMode) {
      return NextResponse.json({
        error: systemConfig.maintenanceMessage || "النظام حالياً في وضع الصيانة. يرجى المحاولة بعد قليل.",
      }, { status: 503 });
    }

    const response = await callWithRetry(() => 
      getGeminiClient(systemConfig?.geminiApiKeys).models.generateContent({
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

    return NextResponse.json({ audio: base64Audio });

  } catch (error: any) {
    console.error("TTS API error:", error);
    
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

    return NextResponse.json({ 
      error: friendlyError,
      technicalDetails: error.message || "An error occurred during speech synthesis"
    }, { status: 500 });
  }
}
