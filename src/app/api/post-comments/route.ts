// app/api/post-comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function POST(req: Request) {
    const session = await auth();
    const userIdRaw = session?.user?.id;
    const who_comments = userIdRaw != null ? parseInt(String(userIdRaw), 10) : NaN;

    if (!Number.isFinite(who_comments)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const post_id = Number(body?.post_id);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

    if (!Number.isFinite(post_id) || comment.length === 0) {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // opcional: validar que el post exista y esté activo
    const post = await prisma.post.findFirst({
        where: { id: post_id, active: 1 },
        select: { id: true },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const created = await prisma.post_comment.create({
        data: {
            post_id,
            comment,
            who_comments,
            active: 1,
        },
        select: {
            id: true,
            createdAt: true,
            post_id: true,
            who_comments: true,
            comment: true,
        },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
