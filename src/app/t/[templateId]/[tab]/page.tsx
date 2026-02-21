// src/app/t/[templateId]/[tab]/page.tsx
import { notFound } from "next/navigation";

import { TemplateSiteView } from "@/components/site-templates/TemplateSiteView";
import {
    getSiteTemplateById,
    isValidTemplateTab,
    normalizeTemplateNav,
} from "@/lib/site-templates/siteTemplates";

function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

export default async function TemplateTabPage({
    params,
}: {
    params: Promise<{ templateId: string; tab: string }>;
}) {
    const { templateId, tab } = await params;

    const t = getSiteTemplateById(templateId);
    if (!t) notFound();

    if (!isValidTemplateTab(t, tab)) notFound();

    const business = (t as any).business;
    const site = (t as any).site;
    const pages = Array.isArray((t as any).pages) ? (t as any).pages : [];

    // normalize nav para asegurar reglas (home/contacto + dedupe + sort)
    const nav = normalizeTemplateNav(site?.nav);
    if (!nav.length) notFound();

    const tabSlug = String(tab || "").trim();

    return (
        <TemplateSiteView
            templateId={templateId}
            business={business}
            site={{
                ...site,
                nav,
                // por si vinieran stringificados desde el json en algún momento:
                homeContent: safeParseJson<any>(site?.homeContent, []),
            }}
            pages={pages.map((p: any, idx: number) => ({
                id: Number.isFinite(Number(p?.id)) ? Number(p.id) : idx + 1,
                slug: String(p?.slug ?? "").trim(),
                title: String(p?.title ?? "").trim(),
                content: safeParseJson<any>(p?.content, []),
            }))}
            tab={tabSlug}
        />
    );
}