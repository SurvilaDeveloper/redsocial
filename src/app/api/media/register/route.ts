//src/app/api/media/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    const url = String(body?.url ?? "").trim();
    const publicId = String(body?.publicId ?? "").trim();

    // opcional
    const thumbUrl = body?.thumbUrl != null ? String(body.thumbUrl).trim() : null;

    if (!url || !publicId) {
        return NextResponse.json({ error: "Missing url/publicId" }, { status: 400 });
    }

    const row = await prisma.cloudinaryImage.upsert({
        where: { publicId },
        update: {
            url,
            userId,
            deletedAt: null,
            // si querés persistir thumb, necesitás columna (ver nota abajo)
        },
        create: { url, publicId, userId },
        select: { id: true, url: true, publicId: true, createdAt: true },
    });

    return NextResponse.json({ item: row });
}
