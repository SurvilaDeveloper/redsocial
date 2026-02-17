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

/**
 * ✅ ÚNICO default válido:
 * - Inicio -> home (slug home)
 * - Contacto -> contact (slug contacto)
 * - Novedades/Productos/Sobre nosotros -> page (slug propio)
 */
const DEFAULT_NAV: BusinessNavItem[] = [
    { kind: "home", slug: "home", title: "Inicio", order: 0, visible: true },
    { kind: "page", slug: "novedades", title: "Novedades", order: 1, visible: true },
    { kind: "page", slug: "productos", title: "Productos", order: 2, visible: true },
    { kind: "page", slug: "sobre-nosotros", title: "Sobre nosotros", order: 3, visible: true },
    { kind: "contact", slug: "contacto", title: "Contacto", order: 4, visible: true },
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

/**
 * Normaliza nav vieja/corrupta:
 * - elimina kinds no permitidos (external, services, etc)
 * - fuerza slug en home/contact
 * - mapea slugs viejos: products -> productos, news -> novedades
 * - elimina "services"
 */
function normalizeNav(raw: any): BusinessNavItem[] {
    const list = Array.isArray(raw) ? raw : [];

    const mapped: BusinessNavItem[] = [];

    for (const it of list) {
        const kind = String(it?.kind ?? "").trim();

        if (kind === "home") {
            mapped.push({
                kind: "home",
                slug: "home",
                title: String(it?.title ?? "Inicio"),
                order: Number.isFinite(it?.order) ? Number(it.order) : 0,
                visible: Boolean(it?.visible ?? true),
            });
            continue;
        }

        if (kind === "contact") {
            mapped.push({
                kind: "contact",
                slug: "contacto",
                title: String(it?.title ?? "Contacto"),
                order: Number.isFinite(it?.order) ? Number(it.order) : 99,
                visible: Boolean(it?.visible ?? true),
            });
            continue;
        }

        if (kind === "page") {
            const rawSlug = String(it?.slug ?? "").trim();

            // map slugs viejos a los nuevos
            const slug =
                rawSlug === "products" ? "productos" :
                    rawSlug === "news" ? "novedades" :
                        rawSlug === "about" ? "sobre-nosotros" :
                            rawSlug === "services" ? "" : // ❌ se elimina
                                rawSlug;

            if (!slug) continue;

            mapped.push({
                kind: "page",
                slug,
                title: String(it?.title ?? slug),
                order: Number.isFinite(it?.order) ? Number(it.order) : 0,
                visible: Boolean(it?.visible ?? true),
            });
            continue;
        }

        // ❌ cualquier otro kind se descarta
    }

    // si quedó vacío o incompleto, volvemos al default
    const hasHome = mapped.some((x) => x.kind === "home" && x.slug === "home");
    const hasContact = mapped.some((x) => x.kind === "contact" && x.slug === "contacto");
    if (!hasHome || !hasContact) return DEFAULT_NAV;

    mapped.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const seen = new Set<string>();
    const deduped: BusinessNavItem[] = [];
    for (const x of mapped) {
        if (seen.has(x.slug)) continue;
        seen.add(x.slug);
        deduped.push(x);
    }

    return deduped.length ? deduped : DEFAULT_NAV;
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

            surfaceBgColor: true,

            bgColor: true,
            width: true,

            headerHeight: true,
            headerBgColor: true,

            headerBgSize: true,
            headerBgPosition: true,

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

            headerBgImage: { select: { url: true } },

            site: {
                select: {
                    nav: true,
                    homeContent: true,
                    themePreset: true, // ✅ NUEVO
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
                themePreset: business.site?.themePreset ?? "classic", // ✅ NUEVO
                themeConfig, // queda por si lo querés inspeccionar/debug
                showContactForm: business.site?.showContactForm ?? true,
                contactEmailExists: Boolean(business.site?.contactEmail || business.owner?.email),
            }}
            pages={business.pages.map((p) => ({
                id: p.id,
                slug: p.slug,
                title: p.title,
                content: safeParseJson<BusinessPageContent>(p.content, []),
            }))}
            tab={tabSlug}
        />
    );
}