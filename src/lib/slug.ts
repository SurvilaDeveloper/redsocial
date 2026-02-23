// src/lib/slug.ts

export function normalizeSlug(s: string, max = 80) {
    return String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, max);
}

export function isReservedBusinessSlug(slug: string) {
    // reservá lo que quieras
    return ["admin", "api", "studio", "login", "signup", "u", "b"].includes(slug);
}

/**
 * Slugs reservados para páginas:
 * - "home" es especial (no es una BusinessPage)
 * - legacy: "products/services/wall/contact" quedan reservados para no chocar con rutas viejas
 *
 * ✅ IMPORTANTE: "contacto" NO está reservado (ahora es una page normal)
 */
export function isReservedBusinessPageSlug(slug: string) {
    return ["home", "products", "services", "wall", "contact"].includes(slug);
}

