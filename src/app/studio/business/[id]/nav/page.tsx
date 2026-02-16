//src/app/studio/business/[id]/nav/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessNavEditor } from "@/components/business/editor/BusinessNavEditor";
import type { BusinessNavItem } from "@/types/business";

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

    const nav = safeParseJson<BusinessNavItem[]>(business.site?.nav, DEFAULT_NAV);

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