//src/app/api/post-comment-responses/[id]/deactivate/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
    if (!sessionUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const responseId = Number(id);
    if (Number.isNaN(responseId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const resp = await prisma.postCommentResponse.findUnique({
        where: { id: responseId },
        select: {
            id: true,
            active: true,
            who_responses: true,
            post_comment: {
                select: {
                    who_comments: true, // dueño del comentario padre
                    post: { select: { user_id: true } }, // dueño del post
                },
            },
        },
    });

    if (!resp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if ((resp.active ?? 1) !== 1) return NextResponse.json({ ok: true, already: true });

    const isPostOwner = resp.post_comment.post.user_id === sessionUserId;
    const isCommentOwner = resp.post_comment.who_comments === sessionUserId;
    const isResponseOwner = resp.who_responses === sessionUserId;

    // ✅ tus reglas: dueño del post OR dueño del comentario OR dueño de la respuesta
    if (!isPostOwner && !isCommentOwner && !isResponseOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.postCommentResponse.update({
        where: { id: responseId },
        data: { active: 0 },
    });

    return NextResponse.json({ ok: true });
}

