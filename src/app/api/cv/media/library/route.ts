// src/app/api/cv/media/library/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const curriculumId = Number(searchParams.get("curriculumId"));

        if (!Number.isFinite(curriculumId) || curriculumId <= 0) {
            return NextResponse.json({ error: "curriculumId inválido" }, { status: 400 });
        }

        // Validar ownership
        const cv = await prisma.curriculum.findFirst({
            where: { id: curriculumId, userId },
            select: { id: true },
        });
        if (!cv) return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });

        const images = await prisma.curriculumMedia.findMany({
            where: { userId, curriculumId, status: "active" },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                url: true,
                publicId: true,
                thumbUrl: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ images });
    } catch (err) {
        console.error("cv/media/library error:", err);
        return NextResponse.json({ error: "Error listando imágenes" }, { status: 500 });
    }
}
