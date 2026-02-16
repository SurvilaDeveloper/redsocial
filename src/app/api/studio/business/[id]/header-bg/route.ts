// src/app/api/studio/business/[businessId]/header-bg/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

function safeStr(v: unknown, max = 255) {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s.slice(0, max) : "";
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { id: idParam } = await params;

    const id = parseInt(String(idParam ?? ""), 10);

    if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "businessId inválido a." }, { status: 400 });
    }

    const userId = Number(session.user.id);

    const business = await prisma.business.findFirst({
        where: { id, ownerId: userId, deletedAt: null },
        select: { id: true },
    });

    if (!business) {
        return NextResponse.json({ error: "No autorizado o negocio inexistente." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // ✅ Modo A: setear por id (picker / quitar)
    if ("headerBgImageId" in body) {
        const nextIdRaw = body?.headerBgImageId;
        const nextId = nextIdRaw == null ? null : Number(nextIdRaw);
        if (nextId !== null && (!Number.isFinite(nextId) || nextId <= 0)) {
            return NextResponse.json({ error: "headerBgImageId inválido." }, { status: 400 });
        }

        // (opcional) validar que esa CloudinaryImage exista y sea del user
        if (nextId !== null) {
            const img = await prisma.cloudinaryImage.findFirst({
                where: { id: nextId, userId },
                select: { id: true },
            });
            if (!img) {
                return NextResponse.json({ error: "Imagen inválida o no autorizada." }, { status: 403 });
            }
        }

        const updated = await prisma.business.update({
            where: { id },
            data: { headerBgImageId: nextId },
            select: {
                id: true,
                headerBgImage: { select: { id: true, url: true, publicId: true } },
            },
        });

        return NextResponse.json({ ok: true, business: updated });
    }

    // ✅ Modo B: viene una imagen recién subida (url/publicId)
    const uploaded = body?.uploaded;
    const url = safeStr(uploaded?.url, 255);
    const publicId = safeStr(uploaded?.publicId, 255);

    if (!url || !publicId) {
        return NextResponse.json({ error: "Falta uploaded.url / uploaded.publicId." }, { status: 400 });
    }

    // crear row CloudinaryImage
    const imgRow = await prisma.cloudinaryImage.create({
        data: { userId, url, publicId },
        select: { id: true, url: true, publicId: true },
    });

    // setear en Business
    const updated = await prisma.business.update({
        where: { id },
        data: { headerBgImageId: imgRow.id },
        select: {
            id: true,
            headerBgImage: { select: { id: true, url: true, publicId: true } },
        },
    });

    return NextResponse.json({ ok: true, business: updated });
}

