// src/app/api/studio/business/[id]/nav/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
        const nav = body?.nav;

        if (!Array.isArray(nav)) {
            return NextResponse.json({ error: "Invalid payload: nav must be an array" }, { status: 400 });
        }

        // Verificar ownership
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

        // Guardar en BusinessSite.nav (crea BusinessSite si no existe)
        await prisma.businessSite.upsert({
            where: { businessId },
            create: {
                businessId,
                nav, // Json
            },
            update: {
                nav, // Json
            },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("POST /api/studio/business/[id]/nav error:", e);
        return NextResponse.json(
            { error: "Internal error", detail: String(e?.message ?? e) },
            { status: 500 }
        );
    }
}
