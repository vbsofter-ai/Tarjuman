import { GoogleGenAI } from "@google/genai";

let clientsList: GoogleGenAI[] = [];
let activeIndex = 0;
let currentKeysFingerprint = "";

// Initialize clients list dynamically
export function initializeClients(customKeys?: string | string[]) {
  let keys: string[] = [];
  if (customKeys) {
    if (Array.isArray(customKeys)) {
      keys = customKeys.map(k => k.trim()).filter(Boolean);
    } else if (typeof customKeys === "string") {
      // Split by comma or newline so they can input one per line or comma-separated
      keys = customKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    }
  }

  // Fallback to environment variables if no keys were provided via database config
  if (keys.length === 0) {
    const keysString = process.env.GEMINI_API_KEYS || "";
    const singleKey = process.env.GEMINI_API_KEY || "";
    if (keysString) {
      keys = keysString.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    }
    if (keys.length === 0 && singleKey) {
      keys = [singleKey];
    }
  }

  const fingerprint = keys.join("|");
  // If the keys have changed, re-instantiate clients
  if (fingerprint !== currentKeysFingerprint) {
    clientsList = keys.map(key => new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    }));
    activeIndex = 0;
    currentKeysFingerprint = fingerprint;
    console.log(`[Gemini API] Instantiated ${clientsList.length} clients.`);
  }

  if (clientsList.length === 0) {
    throw new Error("No Gemini API keys defined. Please set GEMINI_API_KEY / GEMINI_API_KEYS in .env or configure keys in the Admin Panel.");
  }
}

export function getGeminiClient(customKeys?: string | string[]): GoogleGenAI {
  initializeClients(customKeys);
  return clientsList[activeIndex];
}

// Function to rotate to the next key
export function rotateGeminiClient(): GoogleGenAI {
  if (clientsList.length <= 1) {
    return clientsList[0];
  }
  
  const oldIndex = activeIndex;
  activeIndex = (activeIndex + 1) % clientsList.length;
  console.warn(`[Gemini API] Rotating API key due to rate limit/quota exhaustion (Index: ${oldIndex} -> ${activeIndex})`);
  return clientsList[activeIndex];
}

export async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let attempt = 0;
  // If we have multiple keys, we allow retrying more times to cycle through the keys
  const maxRetries = Math.max(retries, clientsList.length * 2);

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorStatus = error?.status;
      const errorMessage = String(error?.message || "").toUpperCase();
      const errorCode = String(error?.code || error?.cause?.code || "").toUpperCase();
      
      const isQuotaExceeded = 
        errorStatus === 429 || 
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") || 
        errorMessage.includes("LIMIT");
        
      const isInvalidKey = 
        errorStatus === 400 && 
        (errorMessage.includes("API KEY") || errorMessage.includes("INVALID") || errorMessage.includes("NOT_FOUND"));
      
      // If quota exceeded or API key invalid, rotate key immediately for the next attempt
      if (isQuotaExceeded || isInvalidKey) {
        rotateGeminiClient();
      }

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
        errorCode.includes("UND_ERR") ||
        isInvalidKey; // Retrying with rotated key can resolve invalid key errors too!

      if (isTransient && attempt < maxRetries) {
        console.warn(`[Gemini API] Request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms... (Error: ${error.message || error})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2.0; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
