//src/components/site-templates/TemplateSiteView.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { BusinessDTO, BusinessSiteDTO, BusinessPageDTO } from "@/types/business";

import { TemplateTabs } from "@/components/site-templates/TemplateTabs";
import { TemplateSiteHeader } from "@/components/site-templates/TemplateSiteHeader";
import { TemplateSectionRenderer } from "@/components/site-templates/sections/TemplateSectionRenderer";

export function TemplateSiteView({
    templateId,
    business,
    site,
    pages,
    tab,
}: {
    templateId: string;
    business: BusinessDTO & { headerBgImageUrl?: string | null };
    site: BusinessSiteDTO;
    pages: BusinessPageDTO[];
    tab: string;
}) {
    const sortedNav = useMemo(() => {
        const base = Array.isArray(site.nav) ? site.nav : [];
        return base
            .filter((x) => x && (x as any).visible !== false)
            .slice()
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    }, [site.nav]);

    const current = useMemo(() => {
        if (tab === "home") return { kind: "home" as const };

        const page = pages.find((p) => p.slug === tab);
        if (page) return { kind: "page" as const, page };

        return { kind: "notfound" as const };
    }, [tab, pages]);

    const widthPCent =
        business.width === "full"
            ? "w-full"
            : business.width === "xl"
                ? "lg:w-[83%] w-full"
                : business.width === "lg"
                    ? "lg:w-[75%] w-full"
                    : business.width === "md"
                        ? "lg:w-[66%] w-full"
                        : business.width === "sm"
                            ? "lg:w-[50%] w-full"
                            : "lg:w-[83%] w-full";

    return (
        <div className="flex flex-row items-center justify-center w-screen" style={{ backgroundColor: business.surfaceBgColor }}>
            <div className={cn(widthPCent, "min-h-dvh text-slate-100 relative pb-6")} style={{ backgroundColor: business.bgColor }}>
                <div className="bg-black sticky top-0 z-50 w-full">
                    <TemplateTabs templateId={templateId} nav={sortedNav as any} activeTab={tab} pages={pages as any} />
                </div>

                {(business.name || business.headline || business.category) && (
                    <TemplateSiteHeader
                        name={business.name}
                        headline={business.headline}
                        category={business.category}
                        bgImageUrl={(business as any).headerBgImageUrl ?? null}
                        headerHeight={business.headerHeight}
                        headerBgColor={business.headerBgColor}
                        headerOpacityOverlay={(business as any).headerOpacityOverlay ?? 0}
                        headerOverlayPosition={(business as any).headerOverlayPosition ?? "none"}
                        headerBgSize={business.headerBgSize}
                        headerBgPosition={business.headerBgPosition}
                        titleColor={business.titleColor}
                        titleTypography={business.titleTypography}
                        titleTextSize={business.titleTextSize}
                        titleAlignText={business.titleAlignText}
                        headlineColor={business.headlineColor}
                        headlineTypography={business.headlineTypography}
                        headlineTextSize={business.headlineTextSize}
                        headlineAlignText={business.headlineAlignText}
                        categoryColor={business.categoryColor}
                        categoryTypography={business.categoryTypography}
                        categoryTextSize={business.categoryTextSize}
                        categoryAlignText={business.categoryAlignText}
                    />
                )}

                <main className="relative mx-auto w-full px-3 pb-0 mt-4">
                    {current.kind === "home" && (
                        <div className="flex flex-col gap-4">
                            {site.homeContent?.length ? (
                                <TemplateSectionRenderer sections={site.homeContent} templateId={templateId} />
                            ) : (
                                <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                                    <div className="flex items-center gap-2 text-slate-200">
                                        <LayoutGrid size={16} className="opacity-80" />
                                        <span className="font-medium">Inicio</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Este template todavía no configuró su página de inicio.
                                    </p>
                                </Card>
                            )}
                        </div>
                    )}

                    {current.kind === "page" && (
                        <Card className="border-none" style={{ backgroundColor: business.bgColor }}>
                            <div className="mt-4">
                                <TemplateSectionRenderer sections={current.page.content} templateId={templateId} />
                            </div>
                        </Card>
                    )}

                    {current.kind === "notfound" && (
                        <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                            <div className="text-lg font-semibold">Sección no encontrada</div>
                            <p className="mt-2 text-sm text-slate-400">
                                Este tab no existe. Revisá la navegación del template.
                            </p>
                            <div className="mt-4">
                                <Link href={`/t/${templateId}/home`} className="text-sm text-emerald-300 hover:text-emerald-200">
                                    Volver al inicio
                                </Link>
                            </div>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
}