// src/app/api/images/delete/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import cloudinary from "@/lib/cloudinary"; // tu config

const bodySchema = z.object({
    publicId: z.string().min(1),
});

const DELETED_SVG_URL = "/image-deleted.svg";

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { publicId } = parsed.data;

    // (Opcional pero recomendado) validar pertenencia vía CloudinaryImage si lo usás
    const cloudRow = await prisma.cloudinaryImage.findUnique({
        where: { publicId },
        select: { userId: true, url: true },
    });

    if (cloudRow?.userId != null && cloudRow.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const urlToReplace = cloudRow?.url ?? null;

    // 1) Borrar en Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") {
        return NextResponse.json({ error: "Cloudinary delete failed", result }, { status: 500 });
    }

    // 2) Reemplazar en DB (transacción)
    await prisma.$transaction(async (tx) => {
        // User avatar
        await tx.user.updateMany({
            where: { id: userId, imagePublicId: publicId },
            data: { imageUrl: DELETED_SVG_URL, imagePublicId: null },
        });

        // User wall
        await tx.user.updateMany({
            where: { id: userId, imageWallPublicId: publicId },
            data: { imageWallUrl: DELETED_SVG_URL, imageWallPublicId: null },
        });

        // Posts images
        await tx.image.updateMany({
            where: { imagePublicId: publicId },
            data: { imageUrl: DELETED_SVG_URL, imagePublicId: null, active: 0 },
        });

        // Product listing media
        await tx.productListingMedia.updateMany({
            where: { publicId },
            data: { url: DELETED_SVG_URL, publicId: null, active: 0 },
        });

        await tx.productListingMedia.updateMany({
            where: { thumbnailPublicId: publicId },
            data: { thumbnailUrl: DELETED_SVG_URL, thumbnailPublicId: null },
        });

        // Service listing media
        await tx.serviceListingMedia.updateMany({
            where: { publicId },
            data: { url: DELETED_SVG_URL, publicId: null, active: 0 },
        });

        await tx.serviceListingMedia.updateMany({
            where: { thumbnailPublicId: publicId },
            data: { thumbnailUrl: DELETED_SVG_URL, thumbnailPublicId: null },
        });

        // Cloudinary index
        await tx.cloudinaryImage.updateMany({
            where: { publicId },
            data: { deletedAt: new Date(), url: DELETED_SVG_URL },
        });

        // Extra seguridad: si en algún lado quedó solo por URL
        if (urlToReplace) {
            await tx.image.updateMany({
                where: { imageUrl: urlToReplace },
                data: { imageUrl: DELETED_SVG_URL, imagePublicId: null, active: 0 },
            });

            await tx.productListingMedia.updateMany({
                where: { url: urlToReplace },
                data: { url: DELETED_SVG_URL, publicId: null, active: 0 },
            });

            await tx.serviceListingMedia.updateMany({
                where: { url: urlToReplace },
                data: { url: DELETED_SVG_URL, publicId: null, active: 0 },
            });

            await tx.user.updateMany({
                where: { id: userId, imageUrl: urlToReplace },
                data: { imageUrl: DELETED_SVG_URL, imagePublicId: null },
            });

            await tx.user.updateMany({
                where: { id: userId, imageWallUrl: urlToReplace },
                data: { imageWallUrl: DELETED_SVG_URL, imageWallPublicId: null },
            });
        }
    });

    return NextResponse.json({ result: "ok" });
}

