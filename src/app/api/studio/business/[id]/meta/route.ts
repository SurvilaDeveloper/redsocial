// src/app/api/studio/business/[id]/meta/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

function safeStr(v: unknown, max: number) {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s.slice(0, max) : "";
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    // ✅ IMPORTANTE: params ES Promise en tu Next => hay que await
    const { id: idParam } = await params;

    const id = parseInt(String(idParam ?? ""), 10);

    if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json(
            {
                error: "businessId inválido c.",
                debug: { idParam, parsedId: id }, // ✅ debug serializable (sin Promise)
            },
            { status: 400 }
        );
    }

    const body = await req.json().catch(() => ({}));
    const name = safeStr(body?.name, 100);
    const headline = safeStr(body?.headline, 140);
    const category = safeStr(body?.category, 80);

    if (!name) {
        return NextResponse.json({ error: "Name requerido." }, { status: 400 });
    }

    const userId = Number(session.user.id);

    const business = await prisma.business.findFirst({
        where: { id, ownerId: userId, deletedAt: null },
        select: { id: true },
    });

    if (!business) {
        return NextResponse.json(
            { error: "No autorizado o negocio inexistente." },
            { status: 403 }
        );
    }

    const updated = await prisma.business.update({
        where: { id },
        data: {
            // meta
            name,
            headline: headline || null,
            category: category || null,

            // layout
            surfaceBgColor: safeStr(body?.surfaceBgColor, 20) || "#000000",

            bgColor: safeStr(body?.bgColor, 20) || "#000000",
            width: body?.width ?? "xl",
            headerHeight: body?.headerHeight ?? "md",
            headerBgColor: safeStr(body?.headerBgColor, 20) || "#222222",
            headerBgSize: body?.headerBgSize ?? "cover",
            headerBgPosition: body?.headerBgPosition ?? "left",

            // title
            titleColor: safeStr(body?.titleColor, 20) || "#cccccc",
            titleTypography: safeStr(body?.titleTypography, 100) || "system",
            titleTextSize: Number(body?.titleTextSize) || 24,
            titleAlignText: body?.titleAlignText ?? "center",

            // headline
            headlineColor: safeStr(body?.headlineColor, 20) || "#cccccc",
            headlineTypography: safeStr(body?.headlineTypography, 100) || "system",
            headlineTextSize: Number(body?.headlineTextSize) || 20,
            headlineAlignText: body?.headlineAlignText ?? "center",

            // category
            categoryColor: safeStr(body?.categoryColor, 20) || "#cccccc",
            categoryTypography: safeStr(body?.categoryTypography, 100) || "system",
            categoryTextSize: Number(body?.categoryTextSize) || 20,
            categoryAlignText: body?.categoryAlignText ?? "center",
        },
        select: { id: true, name: true, headline: true, category: true },
    });

    return NextResponse.json({ ok: true, business: updated });
}


