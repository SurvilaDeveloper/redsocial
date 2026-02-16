//src/components/business/BusinessSiteView.tsx
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
        if (tab === "home") return { kind: "home" as const };
        if (tab === "products") return { kind: "products" as const };
        if (tab === "services") return { kind: "services" as const };
        if (tab === "wall") return { kind: "wall" as const };
        if (tab === "contact") return { kind: "contact" as const };

        const page = pages.find((p) => p.slug === tab);
        if (page) return { kind: "page" as const, page };

        return { kind: "notfound" as const };
    }, [tab, pages]);

    const widthPCent = business.width === "full" ? "100%" :
        business.width === "xl" ? "83%" :
            business.width === "lg" ? "75%" :
                business.width === "md" ? "66%" :
                    business.width === "sm" ? "50%" : "83%";

    return (
        <div
            className="min-h-dvh text-slate-100 relative pb-6"
            style={{
                backgroundColor: business.bgColor,
                width: widthPCent,
            }}
        >
            <div className="bg-black sticky top-0 z-50 w-full">
                <BusinessTabs slug={business.slug} nav={sortedNav} activeTab={tab} pages={pages} />
            </div>
            {(business.name || business.headline || business.category) &&
                <BusinessSiteHeader
                    name={business.name}
                    headline={business.headline}
                    category={business.category}
                    bgImageUrl={(business as any).headerBgImageUrl ?? (business as any)?.headerBgImage?.url ?? null}

                    headerHeight={business.headerHeight}
                    headerBgColor={business.headerBgColor}

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
            }

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
                    <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                        <div className="text-lg font-semibold">{current.page.title}</div>
                        <div className="mt-4">
                            <BusinessSectionRenderer sections={current.page.content} businessSlug={business.slug} />
                        </div>
                    </Card>
                )}

                {current.kind === "products" && (
                    <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                        <div className="text-lg font-semibold">Productos</div>
                        <p className="mt-2 text-sm text-slate-400">(MVP) Pendiente: listar ProductListing.</p>
                    </Card>
                )}

                {current.kind === "services" && (
                    <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                        <div className="text-lg font-semibold">Servicios</div>
                        <p className="mt-2 text-sm text-slate-400">(MVP) Pendiente: listar ServiceListing.</p>
                    </Card>
                )}

                {current.kind === "wall" && (
                    <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                        <div className="text-lg font-semibold">Novedades</div>
                        <p className="mt-2 text-sm text-slate-400">(MVP) Pendiente: muro del negocio.</p>
                    </Card>
                )}

                {current.kind === "contact" && (
                    <div className="flex flex-col gap-4">
                        <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
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
    );
}

