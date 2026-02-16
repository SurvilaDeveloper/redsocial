// src/app/api/business/[id]/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

function normalizeSlug(s: string) {
    return String(s)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

function isReservedSlug(slug: string) {
    return ["home", "products", "services", "wall", "contact"].includes(slug);
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) {
        return NextResponse.json({ error: "Invalid business id" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, ownerId: true, deletedAt: true, active: true },
    });

    if (!business || business.deletedAt != null || business.active !== 1) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    if (business.ownerId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const title = String(body?.title ?? "").trim();
    const slugRaw = String(body?.slug ?? "");
    const slug = normalizeSlug(slugRaw);
    const content = body?.content ?? [];

    if (!title) return NextResponse.json({ error: "Título requerido." }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Slug requerido." }, { status: 400 });
    if (isReservedSlug(slug)) return NextResponse.json({ error: "Slug reservado." }, { status: 400 });

    // evita duplicado por negocio (ya tenés @@unique([businessId, slug]))
    try {
        const created = await prisma.businessPage.create({
            data: {
                businessId,
                title,
                slug,
                content,
                active: 1,
            },
            select: { id: true },
        });

        return NextResponse.json({ id: created.id });
    } catch (e: any) {
        // MySQL unique constraint
        return NextResponse.json(
            { error: "No se pudo crear. ¿Slug duplicado?" },
            { status: 400 }
        );
    }
}

