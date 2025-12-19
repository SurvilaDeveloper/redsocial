import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajustá el path
import { auth } from "@/auth"; // o getServerSession según tu setup

export async function POST(req: Request) {
    const session = await auth();
    const userIdRaw = session?.user?.id;
    const who_responses = userIdRaw != null ? parseInt(String(userIdRaw), 10) : NaN;

    if (!Number.isFinite(who_responses)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const post_comment_id = Number(body?.post_comment_id);
    const response = typeof body?.response === "string" ? body.response.trim() : "";

    if (!Number.isFinite(post_comment_id) || response.length === 0) {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // (Opcional) validar que el comentario exista y esté activo
    const parent = await prisma.postComment.findFirst({
        where: { id: post_comment_id, active: 1 },
        select: { id: true },
    });

    if (!parent) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const created = await prisma.postCommentResponse.create({
        data: {
            post_comment_id,
            response,
            who_responses,
            active: 1,
        },
        select: {
            id: true,
            createdAt: true,
            response: true,
            who_responses: true,
            post_comment_id: true,
        },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
