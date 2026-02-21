// src/components/business/BusinessSiteView.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { LayoutGrid, Mail } from "lucide-react";

import { Card } from "@/components/ui/card";
import { BusinessTabs } from "./BusinessTabs";
import { BusinessSectionRenderer } from "./sections/BusinessSectionRenderer";
import { BusinessContactSection } from "./BusinessContactSection";
import { BusinessSiteHeader } from "./BusinessSiteHeader";

import type { BusinessDTO, BusinessSiteDTO, BusinessPageDTO } from "@/types/business";
import { cn } from "@/lib/utils";

export function BusinessSiteView({
    business,
    site,
    pages,
    tab,
}: {
    business: BusinessDTO;
    site: BusinessSiteDTO;
    pages: BusinessPageDTO[];
    tab: string;
}) {
    const sortedNav = useMemo(() => {
        const base = Array.isArray(site.nav) ? site.nav : [];
        return base
            .filter((x) => x && x.visible !== false)
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [site.nav]);

    const current = useMemo(() => {
        // ✅ Solo 3 casos: home, contacto, page(slug)
        if (tab === "home") return { kind: "home" as const };

        if (tab === "contacto") return { kind: "contact" as const };

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
            <div
                className={cn(widthPCent, "min-h-dvh text-slate-100 relative pb-6")}
                style={{ backgroundColor: business.bgColor }}
            >
                <div className="bg-black sticky top-0 z-50 w-full">
                    <BusinessTabs slug={business.slug} nav={sortedNav} activeTab={tab} pages={pages} />
                </div>

                {(business.name || business.headline || business.category) && (
                    <BusinessSiteHeader
                        name={business.name}
                        headline={business.headline}
                        category={business.category}
                        bgImageUrl={(business as any).headerBgImageUrl ?? (business as any)?.headerBgImage?.url ?? null}

                        headerHeight={business.headerHeight}
                        headerBgColor={business.headerBgColor}

                        headerOpacityOverlay={business.headerOpacityOverlay}
                        headerOverlayPosition={business.headerOverlayPosition}

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
                                <BusinessSectionRenderer sections={site.homeContent} businessSlug={business.slug} />
                            ) : (
                                <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                                    <div className="flex items-center gap-2 text-slate-200">
                                        <LayoutGrid size={16} className="opacity-80" />
                                        <span className="font-medium">Inicio</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Este negocio todavía no configuró su página de inicio.
                                    </p>
                                </Card>
                            )}
                        </div>
                    )}

                    {current.kind === "page" && (
                        <Card
                            className="p-5 border-none"
                            style={{ backgroundColor: business.bgColor }}
                        >
                            {/*<div className="text-lg font-semibold">{current.page.title}</div>*/}
                            <div className="mt-4">
                                <BusinessSectionRenderer sections={current.page.content} businessSlug={business.slug} />
                            </div>
                        </Card>
                    )}

                    {current.kind === "contact" && (
                        <div className="flex flex-col gap-4">
                            <Card className="bg-black border-slate-800 p-5 rounded-2xl">
                                <div className="text-lg font-semibold">Contacto</div>
                                <p className="mt-2 text-sm text-slate-400">
                                    Completá el formulario y el dueño del negocio recibirá un email para responderte.
                                </p>
                            </Card>

                            {site.showContactForm && site.contactEmailExists ? (
                                <BusinessContactSection businessSlug={business.slug} />
                            ) : (
                                <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Mail size={16} className="opacity-80" />
                                        <span>Formulario deshabilitado</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">
                                        El negocio no tiene configurado el contacto por email.
                                    </p>
                                </Card>
                            )}
                        </div>
                    )}

                    {current.kind === "notfound" && (
                        <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                            <div className="text-lg font-semibold">Sección no encontrada</div>
                            <p className="mt-2 text-sm text-slate-400">
                                Este tab no existe. Revisá la navegación del negocio.
                            </p>
                            <div className="mt-4">
                                <Link
                                    href={`/b/${business.slug}/home`}
                                    className="text-sm text-emerald-300 hover:text-emerald-200"
                                >
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