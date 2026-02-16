//src/lib/productive/extract-cv-keywords.ts
import type { CVContent } from "@/types/cv";
import { STOPWORDS } from "./stopwords";
import type { ProductiveKeywordItem, ProductiveKeywordKind } from "./keyword-types";
import { normalizeKeyword, normalizeToken } from "./normalize";

/**
 * ✅ Produce ProductiveKeywordItem[] con kind:
 * - skill / degree / role / company / project / institution / text
 *
 * ✅ Mantiene extractCvKeywords() legacy que devuelve string[]
 * (por si lo usás en otros lados)
 */

// Campos permitidos por tipo de sección (para “bag” de texto general)
const ALLOW = {
    profile: new Set(["headline"]),
    experience: new Set(["company", "role", "description", "items"]),
    education: new Set(["institution", "degree", "description"]),
    skills: new Set(["name"]),
    projects: new Set(["name", "description"]),
    languages: new Set(["name"]), // opcional
    custom: new Set(["title", "items"]), // data: { title, items[] }
} as const;

type SectionType = keyof typeof ALLOW;

/* =========================================================
   Normalización
========================================================= */

/** token “simple” (una palabra) */
function normalizeTokenFiltered(raw: string): string | null {
    const t = normalizeToken(raw);

    if (!t) return null;
    if (t.length < 2 || t.length > 32) return null;
    if (STOPWORDS.has(t)) return null;
    if (/^\d+$/.test(t)) return null;

    return t;
}


function tokenize(text: string): string[] {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9áéíóúüñ+#.\s-]/gi, " ");
    const parts = cleaned.split(/\s+/);

    const out: string[] = [];
    for (const p of parts) {
        const tok = normalizeTokenFiltered(p);
        if (tok) out.push(tok);
    }
    return out;
}

/* =========================================================
   Dedupe con prioridad de kind
========================================================= */

const KIND_PRIORITY: Record<ProductiveKeywordKind, number> = {
    skill: 700,
    degree: 650,
    role: 600,
    project: 520,
    institution: 500,
    company: 480,
    text: 100,
    tag: 1000,
};

function dedupeItems(items: ProductiveKeywordItem[]): ProductiveKeywordItem[] {
    const best = new Map<string, ProductiveKeywordItem>();

    for (const it of items) {
        const t = normalizeKeyword(it.t);
        if (!t) continue;

        // si es una sola palabra y es stopword => afuera
        if (!t.includes(" ") && STOPWORDS.has(t)) continue;

        const curr = best.get(t);
        if (!curr) {
            best.set(t, { t, k: it.k });
            continue;
        }

        const a = KIND_PRIORITY[curr.k] ?? 0;
        const b = KIND_PRIORITY[it.k] ?? 0;
        if (b > a) best.set(t, { t, k: it.k });
    }

    return Array.from(best.values());
}

/* =========================================================
   Helpers: push
========================================================= */

function pushPhrase(items: ProductiveKeywordItem[], kind: ProductiveKeywordKind, v: unknown) {
    if (typeof v !== "string") return;
    const t = normalizeKeyword(v);
    if (!t) return;
    items.push({ t, k: kind });
}

function pushBagStrings(out: string[], v: unknown) {
    if (typeof v !== "string") return;
    const s = v.trim();
    if (s) out.push(s);
}

function pushFromObjectToBag(out: string[], obj: unknown, allow: Set<string>) {
    if (!obj || typeof obj !== "object") return;
    const rec = obj as Record<string, unknown>;
    for (const key of allow) pushBagStrings(out, rec[key]);
}

function pushFromArrayOfObjectsToBag(out: string[], arr: unknown, allow: Set<string>) {
    if (!Array.isArray(arr)) return;
    for (const it of arr) pushFromObjectToBag(out, it, allow);
}

function pushFromArrayOfStringsToBag(out: string[], arr: unknown) {
    if (!Array.isArray(arr)) return;
    for (const it of arr) pushBagStrings(out, it);
}

/* =========================================================
   Custom kind inference
========================================================= */

function inferCustomItemKind(sectionTitleRaw: unknown): ProductiveKeywordKind {
    const title = normalizeKeyword(typeof sectionTitleRaw === "string" ? sectionTitleRaw : "");

    // skills/competencias/tecnologías
    if (/(skill|skills|habilidad|habilidades|competenc|competencias|tecnolog|tecnologias|stack|herramient)/i.test(title)) {
        return "skill";
    }

    // cursos / certificaciones / formación / educación
    if (/(curso|cursos|certific|certificacion|certificaciones|formacion|educacion|training|course|certification)/i.test(title)) {
        return "degree";
    }

    return "text";
}

/* =========================================================
   Extractor por sección
========================================================= */

function isSectionType(t: unknown): t is SectionType {
    return typeof t === "string" && t in ALLOW;
}

function collectCustom(data: unknown, bag: string[], items: ProductiveKeywordItem[]) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return;

    const rec = data as Record<string, unknown>;

    // custom.title -> text (phrase)
    pushPhrase(items, "text", rec.title);
    pushBagStrings(bag, rec.title);

    const itemKind = inferCustomItemKind(rec.title);

    const arr = rec.items;
    if (!Array.isArray(arr)) return;

    for (const it of arr) {
        if (typeof it === "string") {
            // si tu custom.items algún día es array de strings
            pushPhrase(items, itemKind, it);
            pushBagStrings(bag, it);
            continue;
        }

        if (!it || typeof it !== "object" || Array.isArray(it)) continue;
        const o = it as Record<string, unknown>;

        // items.title => kind inferido (skill/degree/text)
        pushPhrase(items, itemKind, o.title);
        // subtitle suele ser texto útil pero menos “duro”
        pushPhrase(items, "text", o.subtitle);

        // bag para tokens
        pushBagStrings(bag, o.title);
        pushBagStrings(bag, o.subtitle);
        pushBagStrings(bag, o.description);
        pushBagStrings(bag, o.url);
        pushBagStrings(bag, o.date);
    }
}

/* =========================================================
   Public API
========================================================= */

/**
 * ✅ NUEVO: devuelve items con kind
 */
export function extractCvKeywordItems(content: CVContent): ProductiveKeywordItem[] {
    const bag: string[] = [];
    const items: ProductiveKeywordItem[] = [];

    const sections = (content as any)?.sections;
    const safeSections = Array.isArray(sections) ? sections : [];

    for (const sec of safeSections) {
        const type = sec?.type;
        const data = sec?.data;

        if (!isSectionType(type)) continue;

        if (type === "custom") {
            collectCustom(data, bag, items);
            continue;
        }

        // ---- bag (tokens)
        const allow = ALLOW[type];
        if (type === "profile") pushFromObjectToBag(bag, data, allow);
        else pushFromArrayOfObjectsToBag(bag, data, allow);

        // ---- phrases (items con kind)
        if (type === "skills" && Array.isArray(data)) {
            for (const sk of data) pushPhrase(items, "skill", (sk as any)?.name);
        }

        if (type === "education" && Array.isArray(data)) {
            for (const ed of data) {
                pushPhrase(items, "degree", (ed as any)?.degree);
                pushPhrase(items, "institution", (ed as any)?.institution);
            }
        }

        if (type === "experience" && Array.isArray(data)) {
            for (const ex of data) {
                pushPhrase(items, "role", (ex as any)?.role);
                pushPhrase(items, "company", (ex as any)?.company);
                if (Array.isArray((ex as any)?.items)) {
                    for (const s of (ex as any).items) pushPhrase(items, "text", s);
                }
            }
        }

        if (type === "projects" && Array.isArray(data)) {
            for (const p of data) pushPhrase(items, "project", (p as any)?.name);
        }

        if (type === "profile" && data && typeof data === "object") {
            pushPhrase(items, "role", (data as any)?.headline); // headline suele ser rol
        }

        // languages: normalmente ensucia; si querés, dejalo como text
        // if (type === "languages" && Array.isArray(data)) { ... }
    }

    // ---- tokens => items tipo text
    const tokSet = new Set(tokenize(bag.join(" ")));
    for (const t of tokSet) items.push({ t, k: "text" });

    return dedupeItems(items);
}

/**
 * ✅ LEGACY: devuelve string[] (por compatibilidad)
 */
export function extractCvKeywords(content: CVContent): string[] {
    return extractCvKeywordItems(content).map((x) => x.t);
}