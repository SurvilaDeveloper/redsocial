// app/api/post-comments/[id]/reaction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type CommentReaction = "LIKE" | "UNLIKE" | null;

interface Body {
    type: CommentReaction;
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
        return NextResponse.json(
            { error: "Debes iniciar sesión para reaccionar al comentario." },
            { status: 401 }
        );
    }

    const userId = Number(userIdRaw);

    const { id } = await context.params;
    const commentId = Number(id);

    if (!Number.isFinite(commentId)) {
        return NextResponse.json(
            { error: "ID de comentario inválido" },
            { status: 400 }
        );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const type: CommentReaction = body?.type ?? null;

    // Verificar que el comentario exista
    const comment = await prisma.postComment.findUnique({
        where: { id: commentId },
        select: { id: true },
    });

    if (!comment) {
        return NextResponse.json(
            { error: "Comentario no encontrado" },
            { status: 404 }
        );
    }

    let userReaction: CommentReaction = null;

    if (type === "LIKE") {
        const existingLike = await prisma.postCommentLike.findUnique({
            where: {
                userId_post_comment_id: {
                    userId,
                    post_comment_id: commentId,
                },
            },
        });

        if (existingLike) {
            // volver a clickear 👍 → quitar like
            await prisma.postCommentLike.delete({
                where: { id: existingLike.id },
            });
            await prisma.postCommentUnlike.deleteMany({
                where: { userId, post_comment_id: commentId },
            });
            userReaction = null;
        } else {
            // poner like, quitar cualquier unlike
            await prisma.postCommentUnlike.deleteMany({
                where: { userId, post_comment_id: commentId },
            });

            await prisma.postCommentLike.create({
                data: {
                    userId,
                    post_comment_id: commentId,
                },
            });
            userReaction = "LIKE";
        }
    } else if (type === "UNLIKE") {
        const existingUnlike = await prisma.postCommentUnlike.findUnique({
            where: {
                userId_post_comment_id: {
                    userId,
                    post_comment_id: commentId,
                },
            },
        });

        if (existingUnlike) {
            // volver a clickear 👎 → quitar unlike
            await prisma.postCommentUnlike.delete({
                where: { id: existingUnlike.id },
            });
            await prisma.postCommentLike.deleteMany({
                where: { userId, post_comment_id: commentId },
            });
            userReaction = null;
        } else {
            // poner unlike, quitar cualquier like
            await prisma.postCommentLike.deleteMany({
                where: { userId, post_comment_id: commentId },
            });

            await prisma.postCommentUnlike.create({
                data: {
                    userId,
                    post_comment_id: commentId,
                },
            });
            userReaction = "UNLIKE";
        }
    } else {
        // type === null → quitar todo
        await Promise.all([
            prisma.postCommentLike.deleteMany({
                where: { userId, post_comment_id: commentId },
            }),
            prisma.postCommentUnlike.deleteMany({
                where: { userId, post_comment_id: commentId },
            }),
        ]);
        userReaction = null;
    }

    const [likesCount, unlikesCount] = await Promise.all([
        prisma.postCommentLike.count({ where: { post_comment_id: commentId } }),
        prisma.postCommentUnlike.count({ where: { post_comment_id: commentId } }),
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
