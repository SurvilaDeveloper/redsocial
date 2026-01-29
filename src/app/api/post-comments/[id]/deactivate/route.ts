//src/app/api/post-comments/[id]/deactivate/route.ts
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
    const commentId = Number(id);
    if (Number.isNaN(commentId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const comment = await prisma.postComment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            active: true,
            who_comments: true,
            post: { select: { user_id: true } }, // dueño del post
        },
    });

    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if ((comment.active ?? 1) !== 1) return NextResponse.json({ ok: true, already: true });

    const isPostOwner = comment.post.user_id === sessionUserId;
    const isCommentOwner = comment.who_comments === sessionUserId;

    if (!isPostOwner && !isCommentOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.postComment.update({
        where: { id: commentId },
        data: { active: 0 },
    });

    return NextResponse.json({ ok: true });
}
