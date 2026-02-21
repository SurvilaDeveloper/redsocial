// src/app/b/[slug]/[tab]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BusinessSiteView } from "@/components/business/BusinessSiteView";

import type { BusinessNavItem } from "@/types/business";
import type { BusinessPageContent } from "@/types/business-sections";

import {
    DEFAULT_NAV,
    normalizeNav,
    safeParseJson,
    defaultHomeContent,
} from "@/lib/business/public-helpers";

import { PUBLIC_BUSINESS_TAB_PAGE_SELECT } from "@/lib/business/public-selects";

export default async function BusinessTabPage({
    params,
}: {
    params: Promise<{ slug: string; tab: string }>;
}) {
    const { slug, tab } = await params;

    const business = await prisma.business.findUnique({
        where: { slug },
        select: PUBLIC_BUSINESS_TAB_PAGE_SELECT,
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();

    const navRaw = safeParseJson<any[]>(business.site?.nav, DEFAULT_NAV as any);
    const nav = normalizeNav(navRaw);

    const homeContentRaw = safeParseJson<BusinessPageContent>(business.site?.homeContent, []);
    const homeContent = homeContentRaw.length ? homeContentRaw : defaultHomeContent(business.name);

    const themeConfig = safeParseJson<any>(business.site?.themeConfig, null);

    // ✅ Regla: tab debe ser un slug de nav. Si no coincide, 404.
    const tabSlug = String(tab || "").trim();
    const isValidTab = nav.some((i) => i.slug === tabSlug);
    if (!isValidTab) notFound();

    return (
        <BusinessSiteView
            business={{
                id: business.id,
                slug: business.slug,
                name: business.name,
                headline: business.headline ?? "",
                category: business.category ?? "",

                surfaceBgColor: business.surfaceBgColor,

                bgColor: business.bgColor,
                width: business.width,

                headerHeight: business.headerHeight,
                headerBgColor: business.headerBgColor,

                headerOpacityOverlay: business.headerOpacityOverlay,
                headerOverlayPosition: business.headerOverlayPosition,

                headerBgSize: business.headerBgSize,
                headerBgPosition: business.headerBgPosition,

                titleColor: business.titleColor,
                titleTypography: business.titleTypography,
                titleTextSize: business.titleTextSize,
                titleAlignText: business.titleAlignText,

                headlineColor: business.headlineColor,
                headlineTypography: business.headlineTypography,
                headlineTextSize: business.headlineTextSize,
                headlineAlignText: business.headlineAlignText,

                categoryColor: business.categoryColor,
                categoryTypography: business.categoryTypography,
                categoryTextSize: business.categoryTextSize,
                categoryAlignText: business.categoryAlignText,

                ownerName: business.owner?.name ?? "",

                headerBgImageUrl: business.headerBgImage?.url ?? null,
            }}
            site={{
                nav,
                homeContent,
                themePreset: business.site?.themePreset ?? "classic",
                themeConfig, // queda por si lo querés inspeccionar/debug
                showContactForm: business.site?.showContactForm ?? true,
                contactEmailExists: Boolean(business.site?.contactEmail || business.owner?.email),
            }}
            pages={(business.pages ?? []).map((p) => ({
                id: p.id,
                slug: p.slug,
                title: p.title,
                content: safeParseJson<BusinessPageContent>(p.content, []),
            }))}
            tab={tabSlug}
        />
    );
}
