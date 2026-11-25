/**
 * Gemini API helpers for "Consigli AI".
 * The API key is stored only in localStorage (never in the repo).
 */

export const GEMINI_KEY_STORAGE = "gemini_api_key";

export function getGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY_STORAGE) ?? "";
}
export function setGeminiKey(key: string) {
  localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
}

export interface AiBook {
  titolo: string;
  autore: string;
  descrizione: string;
  perche_ti_piacera: string;
}

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Calls the best available Gemini flash model to get 6 personalised book
 * recommendations, with retry on 503 and automatic model fallback on 404/503.
 *
 * Priority order:
 *   1. gemini-3.8-flash  (retry once after 2 s on 503)
 *   2. gemini-3.8-flash-lite
 *   3. gemini-2.5-flash-lite
 *   4. gemini-3.8-pro
 *   5. First model from /v1beta/models that supports generateContent
 *
 * @param readBooks  Books the user has already read (letto = true)
 * @param toReadTitles  Titles already in "Da leggere" (to exclude)
 * @param mood  Optional free-text mood / genre hint
 */
export async function fetchGeminiRecommendations(
  readBooks: { titolo: string; autore: string; rating: number | null; note: string | null }[],
  toReadTitles: string[],
  mood: string,
  apiKey: string,
): Promise<AiBook[]> {
  const readList = readBooks
    .map(
      (b) =>
        `- "${b.titolo}" di ${b.autore}` +
        (b.rating ? ` (voto: ${b.rating}/5)` : "") +
        (b.note ? ` [note: ${b.note}]` : ""),
    )
    .join("\n");

  const excludeList = toReadTitles.map((t) => `- "${t}"`).join("\n");

  const moodLine = mood.trim()
    ? `\nUmore o genere del momento indicato dall'utente: "${mood.trim()}".`
    : "";

  const prompt = `Sei un consulente letterario esperto. Analizza la lista di libri letti dall'utente con i rispettivi voti e note, e suggerisci esattamente 6 libri che potrebbero piacergli basandoti sui suoi gusti.${moodLine}

LIBRI GIÀ LETTI (con voti):
${readList || "Nessuno ancora"}

LIBRI DA ESCLUDERE (già presenti in lista Da leggere):
${excludeList || "Nessuno"}

Rispondi SOLO con un array JSON puro, senza markdown, senza backtick, senza spiegazioni fuori dal JSON. Il formato deve essere esattamente:
[
  {
    "titolo": "...",
    "autore": "...",
    "descrizione": "Breve trama in italiano di 2-3 righe.",
    "perche_ti_piacera": "Una frase personalizzata che collega questo libro ai titoli che hai amato."
  }
]
Restituisci esattamente 6 oggetti, niente di più, niente di meno.`;

  const BASE = "https://generativelanguage.googleapis.com/v1beta";

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
  });

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  /** POST to a specific model; never throws — returns the Response. */
  async function callModel(model: string): Promise<Response> {
    return fetch(`${BASE}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  /**
   * Try a model once; on 503/429 wait `retryMs` ms and try one more time.
   * Returns the final Response (may still be non-ok).
   */
  async function tryModel(model: string, retryMs = 2000): Promise<Response> {
    const r = await callModel(model);
    if (r.status === 503 || r.status === 429) {
      await sleep(retryMs);
      return callModel(model);
    }
    return r;
  }

  /** Discovers models from the API, returns the first that supports generateContent. */
  async function discoverModel(): Promise<string | null> {
    try {
      const r = await fetch(`${BASE}/models?key=${apiKey}`);
      if (!r.ok) return null;
      const json = await r.json() as {
        models?: { name: string; supportedGenerationMethods?: string[] }[];
      };
      const found = (json.models ?? []).find((m) =>
        (m.supportedGenerationMethods ?? []).includes("generateContent"),
      );
      return found ? found.name.replace(/^models\//, "") : null;
    } catch {
      return null;
    }
  }

  // Priority list: preferred first, then static fallbacks, then dynamic discovery
  const STATIC_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.8-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.8-pro",
  ];

  let res: Response | null = null;
  let lastStatus = 0;

  for (const model of STATIC_MODELS) {
    res = await tryModel(model);
    lastStatus = res.status;
    if (res.ok) break;              // success → stop
    if (res.status !== 404 && res.status !== 503 && res.status !== 429) break; // hard error → stop
    // 404 / 503 / 429 → try next
  }

  // If all statics failed with 404/503/429 → try dynamic discovery
  if (!res?.ok && (lastStatus === 404 || lastStatus === 503 || lastStatus === 429)) {
    const discovered = await discoverModel();
    if (discovered) {
      res = await tryModel(discovered);
      lastStatus = res.status;
    }
  }

  if (!res || !res.ok) {
    if (lastStatus === 503 || lastStatus === 429) {
      throw new Error(
        "Tutti i modelli Gemini sono temporaneamente sovraccarichi. Riprova tra qualche minuto.",
      );
    }
    const errText = res ? await res.text() : "Nessuna risposta";
    throw new Error(`Errore Gemini (${lastStatus}): ${errText}`);
  }

  const data: GeminiResponse = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as AiBook[];
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    return parsed.slice(0, 6);
  } catch {
    throw new Error(`Risposta Gemini non valida:\n${raw}`);
  }
}

/* ---------- Cover helpers ---------- */

/**
 * Tries iTunes first, then Open Library.
 * Returns a URL string or null.
 */
export async function fetchCover(titolo: string, autore: string): Promise<string | null> {
  // 1. iTunes / Apple Books
  try {
    const q = encodeURIComponent(`${titolo} ${autore}`);
    const r = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=ebook&country=IT&limit=1`,
    );
    if (r.ok) {
      const json = await r.json();
      const artworkUrl: string | undefined = json?.results?.[0]?.artworkUrl100;
      if (artworkUrl) {
        return artworkUrl.replace("100x100bb", "600x600bb");
      }
    }
  } catch {
    // fall through to Open Library
  }

  // 2. Open Library
  try {
    const q = encodeURIComponent(`${titolo} ${autore}`);
    const r = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`,
    );
    if (r.ok) {
      const json = await r.json();
      const coverId: number | undefined = json?.docs?.[0]?.cover_i;
      if (coverId) {
        return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      }
    }
  } catch {
    // give up
  }

  return null;
}
