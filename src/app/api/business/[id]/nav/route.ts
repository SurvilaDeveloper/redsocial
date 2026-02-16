//src/app/api/business/[id]/nav/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import type { BusinessNavItem } from "@/types/business";
import { BusinessNavSchema } from "@/lib/validators/business";



function defaultTitle(kind: string) {
    if (kind === "home") return "Inicio";
    if (kind === "products") return "Productos";
    if (kind === "services") return "Servicios";
    if (kind === "wall") return "Novedades";
    if (kind === "contact") return "Contacto";
    return "Tab";
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id != null ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const businessId = Number(id);
        if (Number.isNaN(businessId)) {
            return NextResponse.json({ error: "Invalid business id" }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            include: {
                owner: { select: { id: true } },
                site: true,
                pages: { where: { deletedAt: null }, select: { slug: true } },
            },
        });

        if (!business || business.deletedAt != null || business.active !== 1) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        if (business.ownerId !== userId && business.owner?.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const parsed = BusinessNavSchema.safeParse((body as any).nav);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid nav" }, { status: 400 });
        }

        const allowedPageSlugs = new Set((business.pages ?? []).map((p) => p.slug));
        let nav: BusinessNavItem[] = parsed.data as any;

        // Filtrar tabs "page" que no existen (evita huérfanos)
        nav = nav.filter((x) => (x.kind === "page" ? allowedPageSlugs.has(x.slug) : true));

        // Asegurar home
        const hasHome = nav.some((x) => x.kind === "home");
        if (!hasHome) nav = [{ kind: "home", title: "Inicio", visible: true, order: 0 } as any, ...nav];

        // Reindex
        nav = nav.slice(0, 20).map((x, i) => ({ ...x, order: i })) as any;

        const updated = await prisma.businessSite.upsert({
            where: { businessId },
            create: { businessId, nav },
            update: { nav },
            select: { id: true, businessId: true, updatedAt: true, nav: true },
        });

        return NextResponse.json({ ok: true, site: updated });
    } catch (err) {
        console.error("PATCH /api/business/[id]/nav error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
