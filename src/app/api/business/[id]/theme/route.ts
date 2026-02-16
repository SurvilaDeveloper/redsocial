// src/app/api/studio/business/[id]/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) {
        return NextResponse.json({ error: "Invalid business id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const themeConfig = body?.themeConfig;

    if (!themeConfig || typeof themeConfig !== "object") {
        return NextResponse.json({ error: "themeConfig requerido" }, { status: 400 });
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

    // upsert BusinessSite (por si todavía no existe)
    await prisma.businessSite.upsert({
        where: { businessId },
        create: {
            businessId,
            themeConfig,
        },
        update: {
            themeConfig,
        },
    });

    return NextResponse.json({ ok: true });
}
