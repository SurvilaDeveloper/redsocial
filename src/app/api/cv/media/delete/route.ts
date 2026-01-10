// src/app/api/cv/media/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json().catch(() => null);
        const id = Number(body?.id);

        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ error: "id inválido" }, { status: 400 });
        }

        const media = await prisma.curriculumMedia.findFirst({
            where: { id, userId },
            select: { id: true, publicId: true, status: true },
        });

        if (!media) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

        if (media.publicId) {
            await cloudinary.uploader
                .destroy(media.publicId, { resource_type: "image" })
                .catch(() => null);
        }

        await prisma.curriculumMedia.update({
            where: { id: media.id },
            data: {
                status: "deleted",
                deletedAt: new Date(),
                replacedUrl: "/image-deleted.svg",
            },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("cv/media/delete error:", err);
        return NextResponse.json({ error: "Error eliminando" }, { status: 500 });
    }
}
