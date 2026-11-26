/**
 * Groq API helpers for "Consigli AI" (Llama 3.3 70B).
 * The API key is stored only in localStorage (never in the repo).
 */

export const GROQ_KEY_STORAGE = "groq_api_key";

export function getGroqKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GROQ_KEY_STORAGE) ?? "";
}

export function setGroqKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GROQ_KEY_STORAGE, key.trim());
}

export interface AiBook {
  titolo: string;
  autore: string;
  descrizione: string;
  perche_ti_piacera: string;
}

export interface BookDetails {
  coverUrl: string | null;
  pagine: number | null;
}

interface GroqChoice {
  message?: { content?: string };
}

interface GroqResponse {
  choices?: GroqChoice[];
  error?: { message?: string };
}

export interface ReadBookSummary {
  titolo: string;
  autore: string;
  rating: number | null;
  note: string | null;
}

interface GroqModel {
  id: string;
  active?: boolean;
}

interface GroqModelsResponse {
  data?: GroqModel[];
}

const EXCLUDED_MODEL_PARTS = ["whisper", "guard", "tts", "audio", "embed"];
const MODEL_PRIORITY = [
  "llama-3.3",
  "llama-4",
  "llama-3.1-70b",
  "qwen",
  "deepseek",
  "gemma",
  "llama",
];

function modelRank(id: string): number {
  const lower = id.toLowerCase();
  const idx = MODEL_PRIORITY.findIndex((prefix) => lower.includes(prefix));
  const priorityScore = idx === -1 ? MODEL_PRIORITY.length : idx;
  const visionPenalty = lower.includes("vision") ? 100 : 0;
  return priorityScore + visionPenalty;
}

/**
 * Fetches active models from Groq and returns all candidate text generation
 * model IDs sorted by preference, so 404s can fall back to the next model.
 */
async function getCandidateGroqModels(apiKey: string): Promise<string[]> {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401) {
      throw new Error("Groq API Key non valida o scaduta. Controlla la chiave nelle impostazioni.");
    }
    throw new Error(`Impossibile recuperare i modelli Groq (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as GroqModelsResponse;
  const models = (json.data ?? []).filter((m) => m.active !== false);

  const textModels = models
    .filter((m) => {
      const id = m.id.toLowerCase();
      return !EXCLUDED_MODEL_PARTS.some((part) => id.includes(part));
    })
    .sort((a, b) => modelRank(a.id) - modelRank(b.id))
    .map((m) => m.id);

  if (textModels.length === 0) {
    throw new Error("Nessun modello di testo disponibile per questa Groq API Key.");
  }

  return textModels;
}

function extractJsonObject(raw: string): { consigli?: AiBook[] } {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned) as { consigli?: AiBook[] };
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as { consigli?: AiBook[] };
    }
    throw new Error("JSON non trovato nella risposta.");
  }
}

/**
 * Calls Groq Chat Completions using the best active model discovered for the
 * API key, returning 6 personalised book recommendations in JSON format.
 */
export async function fetchGroqRecommendations(
  readBooks: ReadBookSummary[],
  toReadTitles: string[],
  mood: string,
  apiKey: string,
): Promise<AiBook[]> {
  // Prioritise highest-rated books so the model focuses on the user's favourites
  const sortedRead = [...readBooks].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const readList = sortedRead
    .map(
      (b) =>
        `- "${b.titolo}"${b.autore ? ` di ${b.autore}` : ""}` +
        (b.rating ? ` (voto: ${b.rating}/5)` : "") +
        (b.note ? ` [note: ${b.note}]` : ""),
    )
    .join("\n");

  const excludeTitles = [
    ...readBooks.map((b) => b.titolo),
    ...toReadTitles,
  ];
  const excludeList = excludeTitles.map((t) => `- "${t}"`).join("\n");

  const moodLine = mood.trim()
    ? `\nUMORE O GENERE RICHIESTO ORA:\n"${mood.trim()}"`
    : "";

  const systemMessage = `Sei un consulente letterario esperto. Rispondi esclusivamente in italiano e SOLO con un oggetto JSON valido avente questa struttura esatta:
{
  "consigli": [
    {
      "titolo": "...",
      "autore": "...",
      "descrizione": "...",
      "perche_ti_piacera": "..."
    }
  ]
}
Regole rigorose:
- Restituisci esattamente 6 libri consigliati nell'array "consigli".
- "descrizione": breve trama in italiano di massimo 180 caratteri.
- "perche_ti_piacera": motivazione personalizzata in italiano di massimo 120 caratteri legata ai gusti e ai libri amati dall'utente.
- Non consigliare mai nessun titolo presente nella lista dei libri da escludere.`;

  const userMessage = `LIBRI GIÀ LETTI (ordinati dal voto più alto):
${readList || "Nessuno ancora"}${moodLine}

LIBRI DA ESCLUDERE (già letti o già in 'Da leggere'):
${excludeList || "Nessuno"}`;

  const candidateModels = await getCandidateGroqModels(apiKey);

  const callChat = (modelId: string, useJsonFormat: boolean) =>
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
        temperature: 0.7,
        max_tokens: 2048,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
      }),
    });

  let res: Response | null = null;
  for (const modelId of candidateModels) {
    res = await callChat(modelId, true);
    if (res.status === 400) {
      res = await callChat(modelId, false);
    }
    if (res.ok) break;
    if (res.status === 404 || res.status === 403) {
      // Model inaccessible or deprecated for this key: try next candidate
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 0;
    const errText = res ? await res.text() : "Nessuna risposta";
    if (status === 401) {
      throw new Error("Groq API Key non valida o scaduta. Controlla la chiave nelle impostazioni.");
    }
    if (status === 429) {
      throw new Error("Limite richieste Groq raggiunto. Riprova tra qualche secondo.");
    }
    throw new Error(`Errore Groq (${status}): ${errText}`);
  }

  const data: GroqResponse = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = extractJsonObject(raw);
    if (!Array.isArray(parsed.consigli)) {
      throw new Error("Campo 'consigli' mancante nella risposta JSON.");
    }
    return parsed.consigli.slice(0, 6);
  } catch {
    throw new Error(`Risposta Groq non valida:\n${raw}`);
  }
}

/* ---------- Cover & details lookup ---------- */

/**
 * Fetches book cover from iTunes (600x600bb) with automatic fallback to
 * Open Library (which also provides number_of_pages_median).
 */
export async function fetchBookDetails(titolo: string, autore: string): Promise<BookDetails> {
  let coverUrl: string | null = null;
  let pagine: number | null = null;

  // 1. iTunes / Apple Books
  try {
    const term = encodeURIComponent(`${titolo} ${autore}`.trim());
    const r = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=ebook&country=IT&limit=1`,
    );
    if (r.ok) {
      const json = (await r.json()) as { results?: { artworkUrl100?: string }[] };
      const artworkUrl = json.results?.[0]?.artworkUrl100;
      if (artworkUrl) {
        coverUrl = artworkUrl.replace("100x100bb", "600x600bb");
      }
    }
  } catch {
    // fall through to Open Library
  }

  // 2. Fallback automatico su Open Library (per copertina mancante e/o numero pagine)
  if (!coverUrl) {
    try {
      const t = encodeURIComponent(titolo);
      const a = encodeURIComponent(autore);
      const r = await fetch(
        `https://openlibrary.org/search.json?title=${t}&author=${a}&limit=1`,
      );
      if (r.ok) {
        const json = (await r.json()) as {
          docs?: { cover_i?: number; number_of_pages_median?: number }[];
        };
        const doc = json.docs?.[0];
        if (doc?.cover_i) {
          coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        }
        if (typeof doc?.number_of_pages_median === "number" && doc.number_of_pages_median > 0) {
          pagine = doc.number_of_pages_median;
        }
      }
    } catch {
      // ignore fallback errors
    }
  }

  return { coverUrl, pagine };
}
