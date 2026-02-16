// src/app/b/[slug]/[tab]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BusinessSiteView } from "@/components/business/BusinessSiteView";

import type { BusinessNavItem } from "@/types/business";
import type { BusinessPageContent } from "@/types/business-sections";

function defaultHomeContent(businessName: string): BusinessPageContent {
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

const DEFAULT_NAV: BusinessNavItem[] = [
    { kind: "home", title: "Inicio", order: 0, visible: true },
    { kind: "products", title: "Productos", order: 1, visible: true },
    { kind: "services", title: "Servicios", order: 2, visible: true },
    { kind: "wall", title: "Novedades", order: 3, visible: true },
    { kind: "contact", title: "Contacto", order: 4, visible: true },
];

function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

export default async function BusinessTabPage({
    params,
}: {
    params: Promise<{ slug: string; tab: string }>;
}) {
    const { slug, tab } = await params;

    const business = await prisma.business.findUnique({
        where: { slug },
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

            deletedAt: true,
            active: true,

            // ✅ relaciones
            headerBgImage: { select: { url: true } },

            site: {
                select: {
                    nav: true,
                    homeContent: true,
                    themeConfig: true,
                    showContactForm: true,
                    contactEmail: true,
                },
            },

            pages: {
                where: { deletedAt: null, active: 1 },
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    content: true,
                },
            },

            owner: { select: { id: true, name: true, email: true } },
        },
    });


    if (!business || business.deletedAt != null || business.active !== 1) notFound();

    const nav = safeParseJson<BusinessNavItem[]>(business.site?.nav, DEFAULT_NAV);

    const homeContentRaw = safeParseJson<BusinessPageContent>(business.site?.homeContent, []);
    const homeContent = homeContentRaw.length ? homeContentRaw : defaultHomeContent(business.name);

    const themeConfig = safeParseJson<any>(business.site?.themeConfig, null);

    return (
        <BusinessSiteView
            business={{
                id: business.id,
                slug: business.slug,
                name: business.name,
                headline: business.headline ?? "",
                category: business.category ?? "",

                bgColor: business.bgColor,
                width: business.width,

                headerHeight: business.headerHeight,
                headerBgColor: business.headerBgColor,

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

                // ✅ mapeo al DTO (esto era lo que no se entendía)
                headerBgImageUrl: business.headerBgImage?.url ?? null,
            }}
            site={{
                nav,
                homeContent,
                themeConfig,
                showContactForm: business.site?.showContactForm ?? true,
                contactEmailExists: Boolean(business.site?.contactEmail || business.owner?.email),
            }}
            pages={business.pages.map((p) => ({
                id: p.id,
                slug: p.slug,
                title: p.title,
                content: safeParseJson<BusinessPageContent>(p.content, []),
            }))}
            tab={tab}
        />
    );
}