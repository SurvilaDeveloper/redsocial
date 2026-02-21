// src/lib/site-templates/siteTemplates.ts
import raw from "@/data/site-templates.json";
import type { Prisma } from "@prisma/client";

export type SiteTemplate = (typeof raw)[number];

function safeStr(v: any) {
    return typeof v === "string" ? v.trim() : "";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function getAllSiteTemplates(): SiteTemplate[] {
    return Array.isArray(raw) ? (raw as any) : [];
}

export function getSiteTemplateById(templateId: string): SiteTemplate | null {
    const id = safeStr(templateId);
    if (!id) return null;
    return getAllSiteTemplates().find((t) => safeStr((t as any)?.id) === id) ?? null;
}

/**
 * ✅ Theme helpers (para API y /t)
 * Theme vive en `template.site`.
 */
export function getTemplateThemePreset(t: SiteTemplate): string {
    return safeStr((t as any)?.site?.themePreset);
}

export function getTemplateThemeConfig(t: SiteTemplate): Prisma.JsonValue | null {
    const v = (t as any)?.site?.themeConfig;

    if (v == null) return null;

    // por si alguien guardó string JSON
    if (typeof v === "string") {
        try {
            return JSON.parse(v) as any;
        } catch {
            return null;
        }
    }

    // Prisma.JsonValue permite object/array/string/number/bool/null
    if (isPlainObject(v) || Array.isArray(v) || typeof v === "number" || typeof v === "boolean" || typeof v === "string") {
        return v as any;
    }

    return null;
}

export function normalizeTemplateNav(navRaw: any) {
    const list = Array.isArray(navRaw) ? navRaw : [];
    const out: any[] = [];

    for (const it of list) {
        const kind = safeStr(it?.kind);
        const slug = safeStr(it?.slug);
        const title = safeStr(it?.title) || slug || "Tab";

        if (!kind || !slug) continue;
        if (kind !== "home" && kind !== "page" && kind !== "contact") continue;

        out.push({
            kind,
            slug,
            title,
            order: Number.isFinite(Number(it?.order)) ? Number(it.order) : 0,
            visible: typeof it?.visible === "boolean" ? it.visible : true,
        });
    }

    // reglas mínimas: debe existir home/contacto
    const hasHome = out.some((x) => x.kind === "home" && x.slug === "home");
    const hasContact = out.some((x) => x.kind === "contact" && x.slug === "contacto");
    if (!hasHome || !hasContact) return [];

    out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // dedupe por slug
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const x of out) {
        if (seen.has(x.slug)) continue;
        seen.add(x.slug);
        deduped.push(x);
    }

    return deduped;
}

export function isValidTemplateTab(t: SiteTemplate, tab: string): boolean {
    const tabSlug = safeStr(tab);
    if (!tabSlug) return false;

    const nav = normalizeTemplateNav((t as any)?.site?.nav);
    return nav.some((i: any) => safeStr(i.slug) === tabSlug);
}