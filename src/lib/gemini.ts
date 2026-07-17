import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
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
export async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorStatus = error?.status;
      const errorMessage = String(error?.message || "").toUpperCase();
      const errorCode = String(error?.code || error?.cause?.code || "").toUpperCase();
      
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
        errorMessage.includes("BUSY") ||
        errorMessage.includes("FETCH FAILED") ||
        errorMessage.includes("TIMEOUT") ||
        errorCode.includes("TIMEOUT") ||
        errorCode.includes("UND_ERR");

      if (isTransient && attempt < retries) {
        console.warn(`[Gemini API] Request failed with transient status/message/code (${error.message}). Retrying in ${delayMs}ms... (Attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2.5; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
