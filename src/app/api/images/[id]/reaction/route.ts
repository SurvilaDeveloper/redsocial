import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type ImageReaction = "LIKE" | "UNLIKE" | null;

interface Body {
    type: ImageReaction;
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
        return NextResponse.json(
            { error: "Debes iniciar sesión para reaccionar." },
            { status: 401 }
        );
    }

    const userId = Number(userIdRaw);

    const { id } = await context.params;
    const imageId = Number(id);

    if (!Number.isFinite(imageId)) {
        return NextResponse.json(
            { error: "ID de imagen inválido" },
            { status: 400 }
        );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const type: ImageReaction = body?.type ?? null;

    // Verificar que la imagen exista
    const image = await prisma.image.findUnique({
        where: { id: imageId },
        select: { id: true },
    });

    if (!image) {
        return NextResponse.json(
            { error: "Imagen no encontrada" },
            { status: 404 }
        );
    }

    let userReaction: ImageReaction = null;

    if (type === "LIKE") {
        const existingLike = await prisma.imageLike.findUnique({
            where: {
                userId_imageId: {
                    userId,
                    imageId,
                },
            },
        });

        if (existingLike) {
            // volver a clickear 👍 → quitar like (neutro)
            await prisma.imageLike.delete({
                where: { id: existingLike.id },
            });
            await prisma.imageUnlike.deleteMany({
                where: { userId, imageId },
            });
            userReaction = null;
        } else {
            // poner like, quitar cualquier unlike
            await prisma.imageUnlike.deleteMany({
                where: { userId, imageId },
            });

            await prisma.imageLike.create({
                data: {
                    userId,
                    imageId,
                },
            });
            userReaction = "LIKE";
        }
    } else if (type === "UNLIKE") {
        const existingUnlike = await prisma.imageUnlike.findUnique({
            where: {
                userId_imageId: {
                    userId,
                    imageId,
                },
            },
        });

        if (existingUnlike) {
            // volver a clickear 👎 → quitar unlike
            await prisma.imageUnlike.delete({
                where: { id: existingUnlike.id },
            });
            await prisma.imageLike.deleteMany({
                where: { userId, imageId },
            });
            userReaction = null;
        } else {
            // poner unlike, quitar cualquier like
            await prisma.imageLike.deleteMany({
                where: { userId, imageId },
            });

            await prisma.imageUnlike.create({
                data: {
                    userId,
                    imageId,
                },
            });
            userReaction = "UNLIKE";
        }
    } else {
        // type === null → quitar todo
        await prisma.imageLike.deleteMany({
            where: { userId, imageId },
        });
        await prisma.imageUnlike.deleteMany({
            where: { userId, imageId },
        });
        userReaction = null;
    }

    const [likesCount, unlikesCount] = await Promise.all([
        prisma.imageLike.count({ where: { imageId } }),
        prisma.imageUnlike.count({ where: { imageId } }),
    ]);

    return NextResponse.json({
        ok: true,
        userReaction,
        counts: {
            likes: likesCount,
            unlikes: unlikesCount,
        },
    });
}
