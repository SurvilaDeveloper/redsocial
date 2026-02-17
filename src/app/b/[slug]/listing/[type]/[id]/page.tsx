// src/app/b/[slug]/listing/[type]/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessTabs } from "@/components/business/BusinessTabs";
import { ImagesSwiperSites } from "@/components/custom/ImagesSwiperSites";
import { BusinessSiteHeader } from "@/components/business/BusinessSiteHeader";
import { cn } from "@/lib/utils";

import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";

import { safeParseJson, safeStr } from "@/lib/business/public-helpers";
import { PUBLIC_BUSINESS_CHROME_SELECT } from "@/lib/business/public-selects";

type Params = {
    slug: string;
    type: "product" | "service";
    id: string;
};

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
    businessHeadline: string;
    businessCategory: string;

    nav: any[];
    pages: { id: number; slug: string; title: string }[];

    headerBgImageUrl: string | null;

    businessSurfaceBgColor: string;

    businessBgColor: string;
    businessWidth: string;

    businessHeaderHeight: string;
    businessHeaderBgColor: string;

    businessHeaderBgSize: string;
    businessHeaderBgPosition: string;

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
        select: PUBLIC_BUSINESS_CHROME_SELECT,
    });

    if (!business) return null;

    // ⚠️ lógica igual que antes: nav parseado con fallback []
    const nav = safeParseJson<any[]>(business.site?.nav, []);

    return {
        businessId: business.id,
        businessSlug: business.slug,
        businessName: safeStr(business.name, 120) || business.slug,
        businessHeadline: safeStr(business.headline, 140),
        businessCategory: safeStr(business.category, 80),

        businessSurfaceBgColor: business.surfaceBgColor,

        businessBgColor: business.bgColor,
        businessWidth: business.width,

        businessHeaderHeight: business.headerHeight,
        businessHeaderBgColor: business.headerBgColor,

        businessHeaderBgSize: business.headerBgSize,
        businessHeaderBgPosition: business.headerBgPosition,

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
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;
    void viewerId;

    const { slug, type, id } = await params;

    if (type !== "product" && type !== "service") notFound();

    const listingId = Number(id);
    if (!Number.isFinite(listingId) || listingId <= 0) notFound();

    await searchParams; // (lo dejás por si después volvés a usarlo)

    const chrome = await fetchBusinessChrome(slug);
    if (!chrome) notFound();

    const detail = await fetchDetail(type, listingId);
    if (!detail.ok) notFound();

    const listing = detail.data?.listing;
    if (!listing) notFound();

    const mediaMap: Record<number, { id: number; url: string; publicId: string }> = {};
    for (const m of (listing.media ?? []) as any[]) {
        const url = (m.url as string | null) ?? null;
        const thumb = (m.thumbnailUrl as string | null) ?? null;
        const finalUrl = thumb || url;
        if (!finalUrl) continue;

        const mid = Number(m.index);
        if (!Number.isFinite(mid) || mid <= 0) continue;

        mediaMap[mid] = {
            id: mid,
            url: finalUrl,
            publicId: safeStr(m.publicId, 255),
        };
    }

    const title = safeStr(listing.title, 140) || (type === "product" ? "Producto" : "Servicio");

    const widthPCent =
        chrome.businessWidth === "full"
            ? "w-full"
            : chrome.businessWidth === "xl"
                ? "lg:w-[83%] w-full"
                : chrome.businessWidth === "lg"
                    ? "lg:w-[75%] w-full"
                    : chrome.businessWidth === "md"
                        ? "lg:w-[66%] w-full"
                        : chrome.businessWidth === "sm"
                            ? "lg:w-[50%] w-full"
                            : "lg:w-[83%] w-full";

    return (
        <div
            className="flex flex-row items-center justify-center w-full"
            style={{ backgroundColor: chrome.businessSurfaceBgColor }}
        >
            <main
                className={cn(widthPCent, "min-h-dvh text-slate-100 relative pb-6")}
                style={{ backgroundColor: chrome.businessBgColor }}
            >
                <div className="bg-black sticky top-0 z-50 w-full">
                    <BusinessTabs
                        slug={chrome.businessSlug}
                        nav={chrome.nav}
                        pages={chrome.pages}
                        activeTab="__listing__"
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
                        headerBgSize={chrome.businessHeaderBgSize}
                        headerBgPosition={chrome.businessHeaderBgPosition}
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
                        <BackToStudioBusiness label="Volver" />
                        <div className="text-[11px] text-slate-500">
                            {type} · #{listingId}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        </div>
    );
}