// src/app/studio/business/[id]/nav/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessNavEditor } from "@/components/business/editor/BusinessNavEditor";
import type { BusinessNavItem } from "@/types/business";

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

function clampOrder(items: BusinessNavItem[]) {
    return items
        .slice()
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .map((it, idx) => ({ ...it, order: idx }));
}

/**
 * Limpia nav vieja:
 * - elimina products/services/wall/external/etc
 * - fuerza slug en home/contact
 * - mapea slugs viejos: products->productos, news/wall->novedades, about->sobre-nosotros
 * - normaliza order/visible/title
 */
function normalizeNav(raw: any): BusinessNavItem[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: BusinessNavItem[] = [];

    for (const it of list) {
        const kind = String(it?.kind ?? "").trim();

        const parsedOrder = Number(it?.order);
        const order = Number.isFinite(parsedOrder) ? parsedOrder : 0;

        const visible = typeof it?.visible === "boolean" ? it.visible : true;
        const title = String(it?.title ?? "").trim();

        if (kind === "home") {
            out.push({
                kind: "home",
                slug: "home",
                title: title || "Inicio",
                order,
                visible,
            });
            continue;
        }

        if (kind === "contact") {
            out.push({
                kind: "contact",
                slug: "contacto",
                title: title || "Contacto",
                order,
                visible,
            });
            continue;
        }

        if (kind === "page") {
            const rawSlug = String(it?.slug ?? "").trim();

            const slug =
                rawSlug === "products" ? "productos" :
                    rawSlug === "news" ? "novedades" :
                        rawSlug === "wall" ? "novedades" :
                            rawSlug === "about" ? "sobre-nosotros" :
                                rawSlug === "services" ? "" : // ❌ se elimina
                                    rawSlug;

            if (!slug) continue;

            out.push({
                kind: "page",
                slug,
                title: title || slug,
                order,
                visible,
            });
            continue;
        }

        // ❌ kinds viejos (products/services/wall/external/...) se descartan
    }

    const hasHome = out.some((x) => x.kind === "home" && x.slug === "home");
    const hasContact = out.some((x) => x.kind === "contact" && x.slug === "contacto");
    if (!hasHome || !hasContact) return clampOrder(DEFAULT_NAV);

    // dedupe por slug
    const seen = new Set<string>();
    const deduped: BusinessNavItem[] = [];
    for (const x of out) {
        if (seen.has(x.slug)) continue;
        seen.add(x.slug);
        deduped.push(x);
    }

    return clampOrder(deduped.length ? deduped : DEFAULT_NAV);
}

export default async function BusinessNavStudioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin");

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { site: true, pages: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } } },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const navRaw = safeParseJson<any[]>(business.site?.nav, DEFAULT_NAV as any);
    const nav = normalizeNav(navRaw);

    return (
        <BusinessNavEditor
            businessId={business.id}
            businessSlug={business.slug}
            businessName={business.name}
            initialNav={nav}
            pages={business.pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title }))}
        />
    );
}

