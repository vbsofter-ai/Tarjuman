import { getGeminiClient } from "./gemini";
import { getSystemConfig, updateSystemConfig } from "./server-db";

export async function updateDailySeoAeo(force = false) {
  try {
    const config = await getSystemConfig();
    const lastUpdateStr = config.last_seo_update || "1970-01-01T00:00:00.000Z";
    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();
    
    // Check if 24 hours have elapsed
    const diffMs = now.getTime() - lastUpdate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    if (hours < 24 && !force) {
      console.log(`[SEO] Daily update skipped. Only ${hours.toFixed(1)} hours have passed since last update.`);
      return;
    }
    
    console.log("[SEO] Running daily automatic SEO/AEO update...");
    const ai = getGeminiClient();
    
    const prompt = `
    You are an expert SEO and AEO (Answer Engine Optimization) marketer. 
    Generate highly optimized metadata for "Tarjuman AI Translation Studio" (بوابة ترجمان للترجمة الذكية), an advanced translation app.
    It specializes in legal, medical, financial, and technical translations, file OCR translation (layout-preserving), terminology glossary matching, speech synthesis, and semantic/linguistic insights.
    
    Provide the response strictly in JSON format matching this TypeScript schema:
    {
      "seo_title": string, // Catchy, high-ranking title in Arabic & English, max 70 chars.
      "seo_description": string, // Professional meta description in Arabic, max 160 chars.
      "seo_keywords": string, // Comma-separated list of exactly 40 high-traffic search keywords in Arabic & English (e.g. translation, OCR, medical, etc.).
      "aeo_agent_description": string // A high-fidelity, descriptive statement for AI bots (ChatGPT, Gemini, Claude) to learn and answer queries about Tarjuman's capabilities.
    }
    
    Ensure the JSON is valid and fits exactly this structure. Do not include markdown code block formatting.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini for SEO update.");
    }
    
    const seoData = JSON.parse(resultText);
    
    // Validate fields exist
    if (seoData.seo_title && seoData.seo_description && seoData.seo_keywords && seoData.aeo_agent_description) {
      await updateSystemConfig({
        seo_title: seoData.seo_title.trim(),
        seo_description: seoData.seo_description.trim(),
        seo_keywords: seoData.seo_keywords.trim(),
        aeo_agent_description: seoData.aeo_agent_description.trim(),
        last_seo_update: now.toISOString()
      });
      console.log("[SEO] Daily automatic SEO/AEO update completed successfully.");
    } else {
      console.warn("[SEO] Generated data is missing some fields. Skipping save.");
    }
  } catch (error) {
    console.error("[SEO] Daily update error:", error);
  }
}

// Background scheduler check
let schedulerStarted = false;
export function startSeoScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  
  console.log("[SEO] Initialized automatic daily SEO check.");
  // Run initial check on server startup (non-blocking)
  updateDailySeoAeo().catch(err => console.error("Initial SEO run error:", err));
  
  // Check every 6 hours
  setInterval(() => {
    updateDailySeoAeo().catch(err => console.error("Periodic SEO run error:", err));
  }, 6 * 60 * 60 * 1000);
}
