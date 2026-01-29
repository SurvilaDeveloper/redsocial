//src/app/api/post-comments/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/zod";

export const runtime = "nodejs";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reporterId = Number(session.user.id);

    const { id } = await params;
    const commentId = Number(id);
    if (Number.isNaN(commentId)) {
        return NextResponse.json({ error: "Invalid comment id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    const { reason, details } = parsed.data;

    const comment = await prisma.postComment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            active: true,
            who_comments: true,
        },
    });

    if (!comment || (comment.active ?? 1) !== 1) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Si sos dueño del comentario, no “denunciás”: lo eliminás.
    if (comment.who_comments === reporterId) {
        return NextResponse.json({ error: "You can't report your own comment" }, { status: 400 });
    }

    try {
        const created = await prisma.contentReport.create({
            data: {
                reporterId,
                targetType: "COMMENT",
                targetId: commentId,
                reason,
                details,
            },
            select: { id: true, createdAt: true },
        });

        return NextResponse.json({ ok: true, data: created });
    } catch (e: any) {
        // Unique constraint (ya reportado)
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Already reported" }, { status: 409 });
        }
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
