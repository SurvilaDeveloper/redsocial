// src/app/b/[slug]/listing/[type]/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessTabs } from "@/components/business/BusinessTabs";
import { ImagesSwiperSites } from "@/components/custom/ImagesSwiperSites";
import { BusinessSiteHeader } from "@/components/business/BusinessSiteHeader";

type Params = {
    slug: string;
    type: "product" | "service";
    id: string;
};

function safeBack(from: unknown, fallback: string) {
    const s = typeof from === "string" ? from.trim() : "";
    if (!s) return fallback;
    if (s.startsWith("/")) return s; // solo rutas internas
    return fallback;
}

function safeStr(v: unknown, max = 200) {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s.slice(0, max) : "";
}

function safeJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

async function fetchDetail(type: string, id: number) {
    const base = process.env.NEXTAUTH_URL ?? "";
    const url = `${base}/api/listings/detail?type=${encodeURIComponent(type)}&id=${id}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

type Chrome = {
    businessId: number;
    businessSlug: string;
    businessName: string;
    businessHeadline: string; // ✅ normalizado (nunca null)
    businessCategory: string; // ✅ normalizado (nunca null)
    nav: any[]; // si querés, tipalo luego con tu BusinessNavItem
    pages: { id: number; slug: string; title: string }[];
    headerBgImageUrl: string | null;

    businessBgColor: string;
    businessWidth: string;

    businessHeaderHeight: string;
    businessHeaderBgColor: string;

    businessTitleColor: string;
    businessTitleTypography: string;
    businessTitleTextSize: number;
    businessTitleAlignText: string;

    businessHeadlineColor: string;
    businessHeadlineTypography: string;
    businessHeadlineTextSize: number;
    businessHeadlineAlignText: string;

    businessCategoryColor: string;
    businessCategoryTypography: string;
    businessCategoryTextSize: number;
    businessCategoryAlignText: string;


};

async function fetchBusinessChrome(slug: string): Promise<Chrome | null> {
    const business = await prisma.business.findFirst({
        where: { slug, deletedAt: null, active: 1 },
        select: {
            id: true,
            slug: true,
            name: true,
            headline: true,
            category: true,

            bgColor: true,
            width: true,

            headerHeight: true,
            headerBgColor: true,

            titleColor: true,
            titleTypography: true,
            titleTextSize: true,
            titleAlignText: true,

            headlineColor: true,
            headlineTypography: true,
            headlineTextSize: true,
            headlineAlignText: true,

            categoryColor: true,
            categoryTypography: true,
            categoryTextSize: true,
            categoryAlignText: true,

            // ✅ NUEVO
            headerBgImage: { select: { url: true } },
            site: {
                select: {
                    nav: true, // ✅ nav vive en BusinessSite
                },
            },
            pages: {
                where: { deletedAt: null, active: 1 },
                select: { id: true, slug: true, title: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!business) return null;

    const nav = safeJson<any[]>(business.site?.nav, []);

    return {
        businessId: business.id,
        businessSlug: business.slug,
        businessName: safeStr(business.name, 120) || business.slug,
        businessHeadline: safeStr(business.headline, 140), // ✅ null => ""
        businessCategory: safeStr(business.category, 80), // ✅ null => ""

        businessBgColor: business.bgColor,
        businessWidth: business.width,

        businessHeaderHeight: business.headerHeight,
        businessHeaderBgColor: business.headerBgColor,

        businessTitleColor: business.titleColor,
        businessTitleTypography: business.titleTypography,
        businessTitleTextSize: business.titleTextSize,
        businessTitleAlignText: business.titleAlignText,

        businessHeadlineColor: business.headlineColor,
        businessHeadlineTypography: business.headlineTypography,
        businessHeadlineTextSize: business.headlineTextSize,
        businessHeadlineAlignText: business.headlineAlignText,

        businessCategoryColor: business.categoryColor,
        businessCategoryTypography: business.categoryTypography,
        businessCategoryTextSize: business.categoryTextSize,
        businessCategoryAlignText: business.categoryAlignText,

        nav,
        pages: business.pages ?? [],
        headerBgImageUrl: business.headerBgImage?.url ?? null,
    };
}

export default async function ListingDetailPage({
    params,
    searchParams,
}: {
    params: Promise<Params>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    // (hoy no lo usás dentro, pero lo dejo por si después metés permisos extra en chrome)
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;
    void viewerId;

    const { slug, type, id } = await params;

    if (type !== "product" && type !== "service") notFound();

    const listingId = Number(id);
    if (!Number.isFinite(listingId) || listingId <= 0) notFound();

    const sp = await searchParams;
    const backHref = safeBack(sp?.from, `/b/${slug}`);

    // ✅ Chrome del negocio (tabs + páginas)
    const chrome = await fetchBusinessChrome(slug);
    if (!chrome) notFound();

    // ✅ Detalle listing (con permisos)
    const detail = await fetchDetail(type, listingId);
    if (!detail.ok) {
        // 404/403/400 => notFound para no filtrar existencia
        notFound();
    }

    const listing = detail.data?.listing;
    if (!listing) notFound();

    // ✅ mediaMap para ImagesSwiperSites: Record<number,{id,url,publicId}>
    const mediaMap: Record<number, { id: number; url: string; publicId: string }> = {};
    for (const m of (listing.media ?? []) as any[]) {
        const url = (m.url as string | null) ?? null;
        const thumb = (m.thumbnailUrl as string | null) ?? null;
        const finalUrl = thumb || url;
        if (!finalUrl) continue;

        const mid = Number(m.index);       ////////////////// REVISANDO QUE EL CAMBIO NO TIRE ERROR//////////////////////////////
        if (!Number.isFinite(mid) || mid <= 0) continue;

        mediaMap[mid] = {
            id: mid,
            url: finalUrl,
            publicId: safeStr(m.publicId, 255),
        };
    }

    const title = safeStr(listing.title, 140) || (type === "product" ? "Producto" : "Servicio");
    const widthPCent = chrome.businessWidth === "full" ? "100%" :
        chrome.businessWidth === "xl" ? "83%" :
            chrome.businessWidth === "lg" ? "75%" :
                chrome.businessWidth === "md" ? "66%" :
                    chrome.businessWidth === "sm" ? "50%" : "83%";

    return (
        <main
            className="min-h-dvh text-slate-100 relative pb-6"
            style={{
                backgroundColor: chrome.businessBgColor,
                width: widthPCent,
            }}
        >
            {/* ✅ BusinessTabs (barra superior del negocio) */}
            <div className="bg-black sticky top-0 z-50 w-full">
                <BusinessTabs
                    slug={chrome.businessSlug}
                    nav={chrome.nav}
                    pages={chrome.pages}
                    activeTab="__listing__" // ✅ a propósito: no matchea nada
                />
            </div>

            {(chrome.businessName || chrome.businessHeadline || chrome.businessCategory) && (
                <BusinessSiteHeader
                    name={chrome.businessName}
                    headline={chrome.businessHeadline}
                    category={chrome.businessCategory}
                    bgImageUrl={chrome.headerBgImageUrl}
                    headerHeight={chrome.businessHeaderHeight}
                    headerBgColor={chrome.businessHeaderBgColor}

                    titleColor={chrome.businessTitleColor}
                    titleTypography={chrome.businessTitleTypography}
                    titleTextSize={chrome.businessTitleTextSize}
                    titleAlignText={chrome.businessTitleAlignText}

                    headlineColor={chrome.businessHeadlineColor}
                    headlineTypography={chrome.businessHeadlineTypography}
                    headlineTextSize={chrome.businessHeadlineTextSize}
                    headlineAlignText={chrome.businessHeadlineAlignText}

                    categoryColor={chrome.businessCategoryColor}
                    categoryTypography={chrome.businessCategoryTypography}
                    categoryTextSize={chrome.businessCategoryTextSize}
                    categoryAlignText={chrome.businessCategoryAlignText}
                />
            )}

            <div className="relative mx-auto max-w-5xl px-4 py-6 flex flex-col">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={backHref}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                    >
                        Volver
                    </Link>

                    <div className="text-[11px] text-slate-500">
                        {type} · #{listingId}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Gallery */}
                    <div className="flex flex-row items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-3">
                        {Object.keys(mediaMap).length > 0 ? (
                            <div className="max-w-[320px] w-full h-auto">
                                <ImagesSwiperSites mediaMap={mediaMap} />
                            </div>
                        ) : (
                            <div className="h-[340px] flex items-center justify-center text-sm text-slate-500">
                                Sin imágenes
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                        <div className="text-xl font-semibold">{title}</div>

                        <div className="mt-4 grid gap-2 text-sm">
                            {listing.price != null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Precio</span>
                                    <span className="text-slate-100">
                                        {String(listing.currency ?? "ARS")} {String(listing.price)}
                                    </span>
                                </div>
                            )}

                            {!!safeStr(listing.clarifications, 5000) && (
                                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
                                    <div className="text-xs text-slate-400">Aclaraciones</div>
                                    <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">
                                        {String(listing.clarifications)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* futuras secciones: reviews, variantes, etc */}
                    </div>
                </div>

                {!!safeStr(listing.description, 5000) && (
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 whitespace-pre-wrap flex flex-col gap-4">
                        <div className="text-slate-400 text-sm">Descripción</div>
                        {String(listing.description)}
                    </div>
                )}
            </div>
        </main>
    );
}


