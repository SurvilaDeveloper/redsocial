// src/app/api/studio/business/[id]/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    let body: any = null;
    try {
        body = await req.json();
    } catch {
        body = null;
    }

    // puede ser object o null
    const raw = body?.themeConfig as unknown;

    if (raw === undefined) {
        return NextResponse.json({ error: "themeConfig requerido" }, { status: 400 });
    }

    // Validación mínima: objeto o null (no array, no string, etc.)
    if (raw !== null) {
        if (typeof raw !== "object" || Array.isArray(raw)) {
            return NextResponse.json({ error: "themeConfig inválido" }, { status: 400 });
        }
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

    // Prisma NO acepta null directo en Json: usá DbNull para guardar NULL en DB
    const themeConfigForDb: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
        raw === null ? Prisma.DbNull : (raw as Prisma.InputJsonValue);

    await prisma.businessSite.upsert({
        where: { businessId },
        create: {
            businessId,
            themeConfig: themeConfigForDb,
        },
        update: {
            themeConfig: themeConfigForDb,
        },
    });

    return NextResponse.json({ ok: true });
}

