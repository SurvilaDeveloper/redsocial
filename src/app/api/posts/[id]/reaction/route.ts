// src/app/api/posts/[id]/reaction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type ReactionType = "LIKE" | "UNLIKE" | null;

interface Body {
    type: ReactionType; // "LIKE" | "UNLIKE" | null
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
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
    const postId = Number(params.id);

    if (!Number.isFinite(postId)) {
        return NextResponse.json(
            { error: "ID de post inválido" },
            { status: 400 }
        );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const type: ReactionType = body?.type ?? null;

    // Verificar que el post exista
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true },
    });

    if (!post) {
        return NextResponse.json(
            { error: "Post no encontrado" },
            { status: 404 }
        );
    }

    let userReaction: ReactionType = null;

    if (type === "LIKE") {
        // ¿Ya tenía like?
        const existingLike = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        if (existingLike) {
            // Volver a clickear 👍 → quito el like (queda sin reacción)
            await prisma.postLike.delete({
                where: { id: existingLike.id },
            });
            await prisma.postUnlike.deleteMany({
                where: { userId, postId },
            });
            userReaction = null;
        } else {
            // Pongo like, quito cualquier unlike
            await prisma.postUnlike.deleteMany({
                where: { userId, postId },
            });

            await prisma.postLike.create({
                data: {
                    userId,
                    postId,
                },
            });
            userReaction = "LIKE";
        }
    } else if (type === "UNLIKE") {
        // ¿Ya tenía unlike?
        const existingUnlike = await prisma.postUnlike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        if (existingUnlike) {
            // Volver a clickear 👎 → quito el unlike
            await prisma.postUnlike.delete({
                where: { id: existingUnlike.id },
            });
            await prisma.postLike.deleteMany({
                where: { userId, postId },
            });
            userReaction = null;
        } else {
            // Pongo unlike, quito cualquier like
            await prisma.postLike.deleteMany({
                where: { userId, postId },
            });

            await prisma.postUnlike.create({
                data: {
                    userId,
                    postId,
                },
            });
            userReaction = "UNLIKE";
        }
    } else {
        // type === null → quitar todo
        await prisma.postLike.deleteMany({
            where: { userId, postId },
        });
        await prisma.postUnlike.deleteMany({
            where: { userId, postId },
        });
        userReaction = null;
    }

    const [likesCount, unlikesCount] = await Promise.all([
        prisma.postLike.count({ where: { postId } }),
        prisma.postUnlike.count({ where: { postId } }),
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
