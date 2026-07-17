/**
 * Daily SEO / AEO / keyword auto-updater.
 *
 * Runs on server boot and then every 6 hours. The actual generation
 * happens at most once per 24h (configurable). Forced updates are
 * possible via the API endpoint.
 *
 * What gets generated (in a single Gemini call):
 *   - seo_title            — homepage <title>
 *   - seo_description      — homepage meta description
 *   - seo_keywords         — legacy flat string (40 mixed AR/EN keywords)
 *   - seo_keyword_strategy — structured { primary[], longTail[], lsi[], trending[] }
 *   - seo_faq              — array of 4–6 fresh FAQ items (bilingual)
 *   - aeo_agent_description — high-fidelity statement for AI crawlers
 *   - aeo_capability_list  — bulleted capability list for Answer Engines
 *   - last_seo_update      — ISO timestamp
 *
 * All fields are stored in `tarjuman_system_config` (a generic KV table
 * with `config_key` / `config_value`). A bounded history of the last
 * 30 snapshots is kept in the `seo_history` key so admins can roll back
 * or compare performance.
 *
 * The same fields are consumed by `app/layout.tsx` to render the
 * organization-level JSON-LD, so a single update here cascades into
 * every page's structured data.
 */

import { getGeminiClient } from "./gemini";
import { getSystemConfig, updateSystemConfig } from "./server-db";

// Keep the last N snapshots so we can roll back if a generation goes
// off the rails (e.g. AI hallucinated the title).
const HISTORY_MAX = 30;
// Minimum interval between runs (hours). The scheduler can fire more
// often but the actual generator will no-op until this elapses.
const MIN_INTERVAL_HOURS = 24;

interface KeywordStrategy {
  primary: string[];     // 8–10 high-intent, bilingual
  longTail: string[];    // 12–15 specific search queries
  lsi: string[];         // 10 semantic / related terms
  trending: string[];     // 5 emerging or seasonal terms
}

interface FAQItem {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

interface SeoSnapshot {
  generatedAt: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_keyword_strategy: KeywordStrategy;
  seo_faq: FAQItem[];
  aeo_agent_description: string;
  aeo_capability_list: string[];
  model: string;
  tokensEstimated?: number;
}

function getIntervalHours(): number {
  const raw = process.env.SEO_INTERVAL_HOURS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : MIN_INTERVAL_HOURS;
}

function defaultKeywordStrategy(): KeywordStrategy {
  return { primary: [], longTail: [], lsi: [], trending: [] };
}

function defaultFaq(): FAQItem[] {
  return [];
}

function defaultCapabilityList(): string[] {
  return [];
}

function buildPrompt(): string {
  return `You are a world-class SEO + AEO (Answer Engine Optimization) strategist for the Arabic-English bilingual translation SaaS "Tarjuman" (https://tarjuman.smarttoolkit.net).

Tarjuman is a multi-tenant AI translation platform specialized in:
  - Legal contracts, briefs, and statutes
  - Medical, pharmaceutical, and clinical reports
  - Financial reports, audits, banking disclosures
  - Technical manuals, software docs, patents
  - Academic papers and theses
  - Commercial / marketing / corporate comms

The product also offers:
  - Layout-preserving PDF / DOCX / image OCR translation
  - Personal terminology glossaries (locked across docs)
  - TTS / speech synthesis in 14 languages
  - Linguistic analysis with cultural adaptation
  - Two payment providers: Paymob (Egypt, EGP) + PayPal (international, USD)
  - A freemium model: Free (5k words/mo), Pro (100k words/mo, $19/999 EGP), Enterprise (unlimited, $49/2499 EGP)

Your job is to produce a SINGLE JSON object with the fields below. The output will be used:
  1. Directly as <title>, <meta description>, and as Schema.org JSON-LD
  2. Fed to AI crawlers (ChatGPT, Perplexity, Gemini, Claude) as the
     authoritative description of Tarjuman's capabilities
  3. Inserted verbatim into the AI search-ranker pipelines, so accuracy
     and freshness matter more than verbosity

Output schema (strict JSON, no markdown, no commentary):

{
  "seo_title": "string, max 70 chars, includes Tarjuman brand and primary keyword",
  "seo_description": "string, max 160 chars, includes primary keyword, value prop, and a call to action",
  "seo_keywords": "string, comma-separated list of exactly 40 high-traffic search terms in Arabic AND English",
  "seo_keyword_strategy": {
    "primary": ["8-10 high-intent bilingual keywords, e.g. 'ترجمة قانونية', 'legal translation Arabic'"],
    "longTail": ["12-15 specific long-tail queries people actually search, e.g. 'translate PDF legal contract Arabic to English'"],
    "lsi": ["10 latent-semantic-indexing related terms Google uses for context"],
    "trending": ["5 emerging/seasonal keywords, e.g. 'AI translation 2026', 'AI ترجمة المستندات بدقة', 'free OCR translator Arabic'"]
  },
  "seo_faq": [
    {
      "questionAr": "string",
      "questionEn": "string",
      "answerAr": "string, 2-3 sentences, factual",
      "answerEn": "string, 2-3 sentences, factual"
    }
    // 4–6 items total
  ],
  "aeo_agent_description": "string, 4-6 sentences. Pure factual statement of what Tarjuman does, who it is for, what differentiates it, and which models/regions it serves. Written for an AI assistant to read and quote verbatim when a user asks 'what is the best Arabic translation tool for legal documents?'",
  "aeo_capability_list": ["string, 6-10 concrete capabilities phrased as user benefits, not features"]
}

Hard requirements:
  - Return PURE JSON. No markdown. No prose. No code fences.
  - All Arabic strings must be Modern Standard Arabic, not dialect.
  - Do NOT invent features Tarjuman does not have.
  - Do NOT use placeholder text like "..." or "TBD".
  - seo_title MUST contain the word "Tarjuman" or "ترجمان".
  - seo_keywords MUST be 40 terms (count the commas + 1).
  - seo_faq must be 4–6 items; each answer must be self-contained.`;
}

/**
 * Heuristic to count approximate tokens consumed (input + output).
 * Useful for cost tracking — not a hard measurement.
 */
function estimateTokens(snapshot: SeoSnapshot): number {
  const text = JSON.stringify(snapshot);
  // ~4 chars per token on average for English/Arabic.
  return Math.ceil(text.length / 4);
}

async function generateSeoSnapshot(): Promise<SeoSnapshot> {
  // Use the cheapest model — this runs every 24h and is pure
  // text-in / JSON-out. Flash is the right tier (per the model
  // selection pattern in MEMORY.md).
  //
  // 2026 update: gemini-2.5-flash is being sunset for new AI Studio
  // users. The actual current alias that works for most keys is
  // "gemini-flash-latest" (Google-maintained rolling alias). Set
  // SEO_MODEL env to override per deployment.
  const model = process.env.SEO_MODEL || "gemini-flash-latest";

  const response: any = await getGeminiClient().models.generateContent({
    model,
    contents: buildPrompt(),
    config: {
      responseMimeType: "application/json",
      // Pin a temperature that's high enough to vary the copy across
      // days but low enough to stay factual.
      temperature: 0.7,
      topP: 0.9,
    },
  });

  const resultText: string | undefined = response?.text;
  if (!resultText) {
    throw new Error("Empty response from Gemini for SEO update.");
  }
  const parsed = JSON.parse(resultText);

  // Defensive normalization — Gemini occasionally drops optional fields.
  const keywordStrategy: KeywordStrategy = {
    primary: Array.isArray(parsed?.seo_keyword_strategy?.primary) ? parsed.seo_keyword_strategy.primary : defaultKeywordStrategy().primary,
    longTail: Array.isArray(parsed?.seo_keyword_strategy?.longTail) ? parsed.seo_keyword_strategy.longTail : defaultKeywordStrategy().longTail,
    lsi: Array.isArray(parsed?.seo_keyword_strategy?.lsi) ? parsed.seo_keyword_strategy.lsi : defaultKeywordStrategy().lsi,
    trending: Array.isArray(parsed?.seo_keyword_strategy?.trending) ? parsed.seo_keyword_strategy.trending : defaultKeywordStrategy().trending,
  };
  const faq: FAQItem[] = Array.isArray(parsed?.seo_faq) ? parsed.seo_faq : defaultFaq();
  const capabilities: string[] = Array.isArray(parsed?.aeo_capability_list) ? parsed.aeo_capability_list : defaultCapabilityList();

  const snapshot: SeoSnapshot = {
    generatedAt: new Date().toISOString(),
    seo_title: String(parsed?.seo_title || "").trim().slice(0, 70),
    seo_description: String(parsed?.seo_description || "").trim().slice(0, 160),
    seo_keywords: String(parsed?.seo_keywords || "").trim(),
    seo_keyword_strategy: keywordStrategy,
    seo_faq: faq.slice(0, 8),
    aeo_agent_description: String(parsed?.aeo_agent_description || "").trim(),
    aeo_capability_list: capabilities.slice(0, 12),
    model,
  };
  snapshot.tokensEstimated = estimateTokens(snapshot);
  return snapshot;
}

function isValidSnapshot(s: SeoSnapshot): boolean {
  return Boolean(
    s.seo_title &&
      s.seo_description &&
      s.seo_keywords &&
      s.aeo_agent_description
  );
}

/**
 * Append the snapshot to the rolling history. The history is stored in
 * the `seo_history` config key as a JSON array, capped at HISTORY_MAX.
 */
async function pushHistory(snapshot: SeoSnapshot): Promise<void> {
  const config = await getSystemConfig();
  const history: SeoSnapshot[] = Array.isArray(config.seo_history) ? config.seo_history : [];
  history.unshift(snapshot); // newest first
  while (history.length > HISTORY_MAX) history.pop();
  await updateSystemConfig({ seo_history: history });
}

export interface UpdateResult {
  ran: boolean;
  reason?: string;
  snapshot?: SeoSnapshot;
}

/**
 * Generate a fresh SEO/AEO snapshot, validate, and persist.
 *
 * @param force If true, bypass the rate-limit check (used by the admin
 *             "force update" endpoint and by the scheduler when it
 *             decides the cached data is stale).
 */
export async function updateDailySeoAeo(force = false): Promise<UpdateResult> {
  try {
    const config = await getSystemConfig();
    const lastUpdateStr: string = config.last_seo_update || "1970-01-01T00:00:00.000Z";
    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();
    const hoursSince = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    const intervalHours = getIntervalHours();

    if (!force && hoursSince < intervalHours) {
      console.log(
        `[SEO] Daily update skipped. Only ${hoursSince.toFixed(1)}h since last update (min ${intervalHours}h).`
      );
      return { ran: false, reason: `Only ${hoursSince.toFixed(1)}h since last update` };
    }

    console.log(`[SEO] Running daily SEO/AEO refresh (forced=${force})...`);
    const snapshot = await generateSeoSnapshot();
    if (!isValidSnapshot(snapshot)) {
      console.warn("[SEO] Generated snapshot missing required fields — skipping save.");
      return { ran: false, reason: "snapshot missing required fields" };
    }

    // Persist the live fields (consumed by layout.tsx → Schema.org) AND
    // append to the history ring buffer.
    await updateSystemConfig({
      seo_title: snapshot.seo_title,
      seo_description: snapshot.seo_description,
      seo_keywords: snapshot.seo_keywords,
      seo_keyword_strategy: snapshot.seo_keyword_strategy,
      seo_faq: snapshot.seo_faq,
      aeo_agent_description: snapshot.aeo_agent_description,
      aeo_capability_list: snapshot.aeo_capability_list,
      last_seo_update: snapshot.generatedAt,
      last_seo_model: snapshot.model,
      last_seo_tokens_estimated: snapshot.tokensEstimated ?? 0,
    });
    await pushHistory(snapshot);

    console.log(
      `[SEO] SEO/AEO refresh complete. ${snapshot.seo_faq.length} FAQ items, ${snapshot.aeo_capability_list.length} capabilities, ~${snapshot.tokensEstimated} tokens.`
    );
    return { ran: true, snapshot };
  } catch (error: any) {
    console.error("[SEO] Daily update error:", error?.message || error);
    return { ran: false, reason: error?.message || "unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Background scheduler
// ---------------------------------------------------------------------------

let schedulerStarted = false;
let timer: ReturnType<typeof setInterval> | null = null;

export function startSeoScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log("[SEO] Initialized automatic daily SEO/AEO scheduler.");

  // Kick off once on server boot (non-blocking).
  updateDailySeoAeo().catch((err) => console.error("[SEO] Initial run error:", err));

  // Re-check every 6 hours. The actual generation has its own 24h
  // rate-limit so this is just a heartbeat.
  const HEARTBEAT_MS = 6 * 60 * 60 * 1000;
  timer = setInterval(() => {
    updateDailySeoAeo().catch((err) => console.error("[SEO] Heartbeat run error:", err));
  }, HEARTBEAT_MS);
  // Don't keep the process alive just for the heartbeat.
  if (typeof timer === "object" && timer && "unref" in timer) {
    (timer as any).unref();
  }
}

export function stopSeoScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  schedulerStarted = false;
}
