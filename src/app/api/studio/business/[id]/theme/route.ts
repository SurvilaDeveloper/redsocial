// src/app/api/studio/business/[id]/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const ALLOWED_PRESETS = ["classic", "modern", "bold", "minimal", "userPreset"] as const;
type AllowedPreset = (typeof ALLOWED_PRESETS)[number];

function isAllowedPreset(v: any): v is AllowedPreset {
    return typeof v === "string" && (ALLOWED_PRESETS as readonly string[]).includes(v);
}

export async function PATCH(
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

    let body: any = null;
    try {
        body = await req.json();
    } catch {
        body = null;
    }

    const rawPreset = body?.themePreset as unknown; // optional
    const rawConfig = body?.themeConfig as unknown; // optional

    // ✅ Debe venir al menos uno
    if (rawPreset === undefined && rawConfig === undefined) {
        return NextResponse.json(
            { error: "Se requiere themePreset y/o themeConfig" },
            { status: 400 }
        );
    }

    // Validar preset si viene
    if (rawPreset !== undefined && !isAllowedPreset(rawPreset)) {
        return NextResponse.json({ error: "themePreset inválido" }, { status: 400 });
    }

    // Validar config si viene: object o null
    if (rawConfig !== undefined) {
        if (rawConfig !== null) {
            if (typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
                return NextResponse.json({ error: "themeConfig inválido" }, { status: 400 });
            }
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

    const updateData: any = {};

    if (rawPreset !== undefined) {
        updateData.themePreset = rawPreset; // string en DB
    }

    if (rawConfig !== undefined) {
        // Prisma NO acepta null directo para Json: DbNull escribe NULL real en DB
        const themeConfigForDb: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
            rawConfig === null ? Prisma.DbNull : (rawConfig as Prisma.InputJsonValue);

        updateData.themeConfig = themeConfigForDb;
    }

    await prisma.businessSite.upsert({
        where: { businessId },
        create: {
            businessId,
            // defaults DB + lo que venga
            ...(updateData.themePreset ? { themePreset: updateData.themePreset } : {}),
            ...(updateData.themeConfig !== undefined ? { themeConfig: updateData.themeConfig } : {}),
        },
        update: updateData,
    });

    return NextResponse.json({ ok: true });
}