//src/lib/slug.ts

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

export function isReservedBusinessPageSlug(slug: string) {
    return ["home", "products", "services", "wall", "contact"].includes(slug);
}
