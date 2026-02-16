// src/lib/productive/normalize.ts

export function stripDiacritics(s: string) {
    return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza keyword final (puede tener espacios):
 * - lower
 * - sin tildes
 * - conserva espacios
 * - conserva chars tech: + # . -
 * - colapsa espacios
 */
export function normalizeKeyword(raw: string): string {
    const s = stripDiacritics(String(raw).toLowerCase())
        .replace(/[^a-z0-9 +#.\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!s) return "";
    if (s.length < 2) return "";
    if (s.length > 80) return s.slice(0, 80).trim();
    return s;
}

/**
 * Token “simple” (una palabra):
 * - lower + sin tildes
 * - conserva chars tech
 * - sin espacios
 */
export function normalizeToken(raw: string): string {
    return stripDiacritics(String(raw).trim().toLowerCase()).replace(/[^a-z0-9+.#-]/g, "");
}
