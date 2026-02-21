// src/lib/templates/siteTemplates.ts
import templatesRaw from "@/data/site-templates.json";
import type { BusinessDTO, BusinessSiteDTO, BusinessPageDTO } from "@/types/business";

export type SiteTemplate = {
    id: string;
    label: string;
    previewImage?: string;

    themePreset?: string;
    themeConfig?: any;

    business: BusinessDTO & { headerBgImageUrl?: string | null };
    site: BusinessSiteDTO;
    pages: BusinessPageDTO[];
};

function asArray(v: any): any[] {
    return Array.isArray(v) ? v : [];
}

export function getAllSiteTemplates(): SiteTemplate[] {
    // JSON import ya viene parseado
    return asArray(templatesRaw) as SiteTemplate[];
}

export function getSiteTemplateById(templateId: string): SiteTemplate | null {
    const id = String(templateId || "").trim();
    if (!id) return null;
    const all = getAllSiteTemplates();
    return all.find((t) => String(t?.id) === id) ?? null;
}

/**
 * ✅ Regla: tab debe existir en nav (slug).
 * Si no existe -> null.
 */
export function resolveTemplateTabOrNull(t: SiteTemplate, tab: string): string | null {
    const tabSlug = String(tab || "").trim();
    if (!tabSlug) return null;

    const nav = asArray(t?.site?.nav);
    const ok = nav.some((i: any) => String(i?.slug) === tabSlug);
    return ok ? tabSlug : null;
}
