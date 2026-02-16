// src/lib/text/keywords.ts

export type WeightedText = { text: string; weight?: number; label?: string };
export type KeywordInput = string | string[] | WeightedText | WeightedText[];

export type ExtractKeywordsOptions = {
    language?: "es" | "en";
    minTokenLength?: number; // default 3
    maxKeywords?: number; // default 30
    normalizeAccents?: boolean; // default true
    stopwords?: Set<string>;
    keepNumbers?: boolean; // default false
};

const ES_STOPWORDS = new Set([
    "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con", "no", "una", "su", "al",
    "lo", "como", "mas", "pero", "sus", "le", "ya", "o", "este", "si", "porque", "esta", "entre", "cuando", "muy", "sin",
    "sobre", "tambien", "me", "hasta", "hay", "donde", "quien", "desde", "todo", "nos", "durante", "todos", "uno", "les",
    "ni", "contra", "otros", "ese", "eso", "ante", "ellos", "e", "esto", "mi", "antes", "algunos", "que", "unos", "yo",
    "otro", "otras", "otra", "el", "tanto", "esa", "estos", "mucho", "quienes", "nada", "muchos", "cual", "poco", "ella",
    "estas", "algunas", "algo", "nosotros", "mis", "tu", "tus", "vos", "usted", "ustedes"
]);

const EN_STOPWORDS = new Set([
    "the", "and", "a", "an", "to", "of", "in", "for", "on", "with", "as", "at", "by", "from", "or", "is", "are", "was", "were",
    "be", "been", "it", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they", "my", "your", "our", "their",
    "not", "but", "so", "if", "then", "than", "too", "very"
]);

function stripAccents(s: string) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(text: string, normalizeAccents: boolean) {
    let t = (text ?? "").toLowerCase();

    // eliminar urls
    t = t.replace(/https?:\/\/\S+/g, " ");

    // reemplazar separadores comunes por espacio
    t = t.replace(/[_/\\|—–\-]+/g, " ");

    if (normalizeAccents) t = stripAccents(t);

    // dejar letras/números/espacios
    t = t.replace(/[^\p{L}\p{N}\s]+/gu, " ");

    // colapsar espacios
    t = t.replace(/\s+/g, " ").trim();

    return t;
}

function toSources(input: KeywordInput): WeightedText[] {
    if (typeof input === "string") return [{ text: input, weight: 1 }];
    if (Array.isArray(input)) {
        if (input.length === 0) return [];
        if (typeof input[0] === "string") {
            return (input as string[]).map((t) => ({ text: t, weight: 1 }));
        }
        return (input as WeightedText[]).map((x) => ({ text: x.text, weight: x.weight ?? 1, label: x.label }));
    }
    // WeightedText single
    return [{ text: input.text, weight: input.weight ?? 1, label: input.label }];
}

export function extractWeightedKeywords(
    input: KeywordInput,
    opts: ExtractKeywordsOptions = {}
): Map<string, number> {
    const {
        language = "es",
        minTokenLength = 3,
        maxKeywords = 30,
        normalizeAccents = true,
        keepNumbers = false,
        stopwords = language === "es" ? ES_STOPWORDS : EN_STOPWORDS,
    } = opts;

    const sources = toSources(input);
    const scores = new Map<string, number>();

    for (const src of sources) {
        const weight = src.weight ?? 1;
        const normalized = normalizeText(src.text, normalizeAccents);
        if (!normalized) continue;

        const tokens = normalized.split(" ").filter(Boolean);

        // frecuencia local por fuente
        const local = new Map<string, number>();

        for (const tok of tokens) {
            if (tok.length < minTokenLength) continue;

            const isNumber = /^\d+$/.test(tok);
            if (isNumber && !keepNumbers) continue;

            if (stopwords.has(tok)) continue;

            local.set(tok, (local.get(tok) ?? 0) + 1);
        }

        for (const [tok, freq] of local.entries()) {
            const add = freq * weight;
            scores.set(tok, (scores.get(tok) ?? 0) + add);
        }
    }

    // Top K global
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const top = new Map<string, number>();

    for (const [tok, sc] of sorted.slice(0, maxKeywords)) {
        top.set(tok, sc);
    }

    return top;
}

export function mapToSortedKeywordsArray(
    kw: Map<string, number>,
    limit = 30
): string[] {
    return Array.from(kw.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k]) => k);
}
