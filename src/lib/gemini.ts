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
 * Calls gemini-2.5-flash to get 6 personalised book recommendations.
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
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
