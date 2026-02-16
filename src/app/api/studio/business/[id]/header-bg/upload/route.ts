// src/app/api/studio/business/[businessId]/header-bg/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ businessId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { businessId } = await params;
    const id = Number(businessId);
    if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "businessId inválido b." }, { status: 400 });
    }

    const userId = Number(session.user.id);

    const business = await prisma.business.findFirst({
        where: { id, ownerId: userId, deletedAt: null },
        select: { id: true },
    });

    if (!business) {
        return NextResponse.json({ error: "No autorizado o negocio inexistente." }, { status: 403 });
    }

    // ✅ usamos la MISMA lógica de siempre:
    // el cliente sube a Cloudinary (uploadSiteImage -> /api/upload-site-image)
    // y acá solo recibimos url/publicId para persistir en DB y setear headerBgImageId
    const body = await req.json().catch(() => null);

    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim() : "";

    if (!url || !publicId) {
        return NextResponse.json(
            { error: "Falta url/publicId. Subí primero a Cloudinary desde el cliente." },
            { status: 400 }
        );
    }

    // ✅ Guardar CloudinaryImage
    const imgRow = await prisma.cloudinaryImage.create({
        data: {
            userId,
            url: url.slice(0, 255),
            publicId: publicId.slice(0, 255),
        },
        select: { id: true, url: true, publicId: true },
    });

    // ✅ Setear en Business
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

