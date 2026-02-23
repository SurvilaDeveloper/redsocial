// src/lib/business/public-helpers.ts
import type { BusinessNavItem } from "@/types/business";
import type { BusinessPageContent } from "@/types/business-sections";

export function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

export function safeStr(v: unknown, max = 200) {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s.slice(0, max) : "";
}

/**
 * ✅ ÚNICO default válido:
 * - Inicio -> home (slug home)
 * - Todo lo demás -> page (incluye contacto)
 */
export const DEFAULT_NAV: BusinessNavItem[] = [
    { kind: "home", slug: "home", title: "Inicio", order: 0, visible: true },
    { kind: "page", slug: "novedades", title: "Novedades", order: 1, visible: true },
    { kind: "page", slug: "productos", title: "Productos", order: 2, visible: true },
    { kind: "page", slug: "sobre-nosotros", title: "Sobre nosotros", order: 3, visible: true },
    { kind: "page", slug: "contacto", title: "Contacto", order: 4, visible: true },
];

/**
 * Normaliza nav vieja/corrupta:
 * - elimina kinds no permitidos (external, services, etc)
 * - fuerza home slug=home
 * - mapea slugs viejos: products -> productos, news -> novedades, about -> sobre-nosotros
 * - "contact" kind viejo => page slug contacto
 */
export function normalizeNav(raw: any): BusinessNavItem[] {
    const list = Array.isArray(raw) ? raw : [];
    const mapped: BusinessNavItem[] = [];

    for (const it of list) {
        const kind = String(it?.kind ?? "").trim();

        if (kind === "home") {
            mapped.push({
                kind: "home",
                slug: "home",
                title: String(it?.title ?? "Inicio"),
                order: Number.isFinite(it?.order) ? Number(it.order) : 0,
                visible: Boolean(it?.visible ?? true),
            });
            continue;
        }

        // backward compat: nav antigua con kind "contact"
        if (kind === "contact") {
            mapped.push({
                kind: "page",
                slug: "contacto",
                title: String(it?.title ?? "Contacto"),
                order: Number.isFinite(it?.order) ? Number(it.order) : 99,
                visible: Boolean(it?.visible ?? true),
            });
            continue;
        }

        if (kind === "page") {
            const rawSlug = String(it?.slug ?? "").trim();

            const slug =
                rawSlug === "products"
                    ? "productos"
                    : rawSlug === "news"
                        ? "novedades"
                        : rawSlug === "about"
                            ? "sobre-nosotros"
                            : rawSlug === "contact"
                                ? "contacto"
                                : rawSlug === "services"
                                    ? ""
                                    : rawSlug;

            if (!slug) continue;

            mapped.push({
                kind: "page",
                slug,
                title: String(it?.title ?? slug),
                order: Number.isFinite(it?.order) ? Number(it.order) : 0,
                visible: Boolean(it?.visible ?? true),
            });
            continue;
        }

        // ❌ cualquier otro kind se descarta
    }

    const hasHome = mapped.some((x) => x.kind === "home" && x.slug === "home");
    if (!hasHome) return DEFAULT_NAV;

    mapped.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const seen = new Set<string>();
    const deduped: BusinessNavItem[] = [];
    for (const x of mapped) {
        if (seen.has(x.slug)) continue;
        seen.add(x.slug);
        deduped.push(x);
    }

    return deduped.length ? deduped : DEFAULT_NAV;
}

export function defaultHomeContent(businessName: string): BusinessPageContent {
    return [
        {
            id: "hero-default",
            kind: "hero",
            data: { title: businessName, subtitle: "Bienvenido/a", align: "left" },
        },
        {
            id: "text-default",
            kind: "text",
            data: { title: "Sobre nosotros", body: "Agregá una descripción desde el editor del sitio." },
        },
    ];
}