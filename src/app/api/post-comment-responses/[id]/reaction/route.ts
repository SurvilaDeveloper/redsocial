// app/api/post-comment-responses/[id]/reaction/route.ts
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
            { error: "Debes iniciar sesión para reaccionar a la respuesta." },
            { status: 401 }
        );
    }

    const userId = Number(userIdRaw);

    const { id } = await context.params;
    const responseId = Number(id);

    if (!Number.isFinite(responseId)) {
        return NextResponse.json(
            { error: "ID de respuesta inválido" },
            { status: 400 }
        );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const type: CommentReaction = body?.type ?? null;

    // Verificar que la respuesta exista
    const responseRow = await prisma.postCommentResponse.findUnique({
        where: { id: responseId },
        select: { id: true },
    });

    if (!responseRow) {
        return NextResponse.json(
            { error: "Respuesta no encontrada" },
            { status: 404 }
        );
    }

    let userReaction: CommentReaction = null;

    if (type === "LIKE") {
        const existingLike = await prisma.postCommentResponseLike.findUnique({
            where: {
                userId_post_comment_responses_id: {
                    userId,
                    post_comment_responses_id: responseId,
                },
            },
        });

        if (existingLike) {
            // volver a clickear 👍 → quitar like
            await prisma.postCommentResponseLike.delete({
                where: { id: existingLike.id },
            });
            await prisma.postCommentResponseUnlike.deleteMany({
                where: { userId, post_comment_responses_id: responseId },
            });
            userReaction = null;
        } else {
            // poner like, quitar cualquier unlike
            await prisma.postCommentResponseUnlike.deleteMany({
                where: { userId, post_comment_responses_id: responseId },
            });

            await prisma.postCommentResponseLike.create({
                data: {
                    userId,
                    post_comment_responses_id: responseId,
                },
            });
            userReaction = "LIKE";
        }
    } else if (type === "UNLIKE") {
        const existingUnlike = await prisma.postCommentResponseUnlike.findUnique({
            where: {
                userId_post_comment_responses_id: {
                    userId,
                    post_comment_responses_id: responseId,
                },
            },
        });

        if (existingUnlike) {
            // volver a clickear 👎 → quitar unlike
            await prisma.postCommentResponseUnlike.delete({
                where: { id: existingUnlike.id },
            });
            await prisma.postCommentResponseLike.deleteMany({
                where: { userId, post_comment_responses_id: responseId },
            });
            userReaction = null;
        } else {
            // poner unlike, quitar cualquier like
            await prisma.postCommentResponseLike.deleteMany({
                where: { userId, post_comment_responses_id: responseId },
            });

            await prisma.postCommentResponseUnlike.create({
                data: {
                    userId,
                    post_comment_responses_id: responseId,
                },
            });
            userReaction = "UNLIKE";
        }
    } else {
        // type === null → quitar todo
        await Promise.all([
            prisma.postCommentResponseLike.deleteMany({
                where: { userId, post_comment_responses_id: responseId },
            }),
            prisma.postCommentResponseUnlike.deleteMany({
                where: { userId, post_comment_responses_id: responseId },
            }),
        ]);
        userReaction = null;
    }

    const [likesCount, unlikesCount] = await Promise.all([
        prisma.postCommentResponseLike.count({
            where: { post_comment_responses_id: responseId },
        }),
        prisma.postCommentResponseUnlike.count({
            where: { post_comment_responses_id: responseId },
        }),
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
