// src/lib/productive/lexical-weight.ts
import { STOPWORDS } from "./stopwords";

/**
 * Heurísticas baratas para bajar peso de "palabras funcionales" / verbales.
 * Esto NO es POS tagging real: es un scoring pragmático para tu profile.
 */

export const COMMON_VERBS_ES = new Set([
    "hacer", "trabajar", "realizar", "desarrollar", "crear", "usar", "utilizar",
    "aprender", "enseñar", "coordinar", "gestionar", "administrar", "liderar",
    "implementar", "analizar", "mejorar", "optimizar", "participar", "colaborar",
    "apoyar", "mantener", "resolver", "planificar", "organizar", "controlar",
    "evaluar", "supervisar", "comunicar", "presentar",
]);

export const COMMON_VERBS_EN = new Set([
    "do", "make", "work", "develop", "create", "use", "learn", "teach",
    "manage", "lead", "implement", "analyze", "improve", "optimize",
    "support", "maintain", "plan", "organize", "control", "evaluate",
    "design", "build", "test", "deploy", "collaborate",
]);

export type LexicalClass =
    | "stop"
    | "verb_strong"
    | "verb_probable"
    | "other";

export function classifyToken(raw: string): LexicalClass {
    const t = normalizeToken(raw);
    if (!t) return "stop";
    if (STOPWORDS.has(t)) return "stop";

    if (COMMON_VERBS_ES.has(t) || COMMON_VERBS_EN.has(t)) return "verb_strong";

    // Heurísticas de verbo (no perfectas, pero útiles para scoring)
    if (looksLikeVerbES(t) || looksLikeVerbEN(t)) return "verb_probable";

    return "other";
}

/**
 * Multiplicador del peso "semántico" del token:
 * - verbos: penalización
 * - stopwords: 0
 * - sustantivos probables / tech keywords: 1
 */
export function lexicalWeight(raw: string): number {
    const cls = classifyToken(raw);

    switch (cls) {
        case "stop":
            return 0;
        case "verb_strong":
            return 0.35;
        case "verb_probable":
            return 0.6;
        default:
            return 1.0;
    }
}

export function normalizeToken(raw: string): string {
    if (typeof raw !== "string") return "";
    return raw
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // saca tildes
        .replace(/[^a-z0-9+.#-]/g, ""); // deja tech-friendly chars
}

function looksLikeVerbES(t: string): boolean {
    // infinitivos y gerundios típicos
    return (
        t.endsWith("ar") ||
        t.endsWith("er") ||
        t.endsWith("ir") ||
        t.endsWith("ando") ||
        t.endsWith("iendo")
    );
}

function looksLikeVerbEN(t: string): boolean {
    // gerundio / pasado simple
    return t.endsWith("ing") || t.endsWith("ed");
}
