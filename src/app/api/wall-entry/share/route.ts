// src/app/api/wall-entry/share/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewerSeePost } from "@/lib/posts/can-view-post";
import { canUserShareToWall } from "@/lib/wall-entry-share-policy";

type Body = {
    postId: number;
    wallUserId: number;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
    const session = await auth();
    const actorUserId = session?.user?.id ? Number(session.user.id) : null;

    if (!actorUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const postId = Number(body?.postId);
    const wallUserId = Number(body?.wallUserId);

    if (
        !Number.isFinite(postId) ||
        postId <= 0 ||
        !Number.isFinite(wallUserId) ||
        wallUserId <= 0
    ) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
        where: {
            id: postId,
            deletedAt: null,
            active: 1,
        },
        select: {
            id: true,
            authorId: true,
            visibility: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // El actor debe poder ver el post que intenta compartir.
    const actorCanView = await canViewerSeePost(prisma, actorUserId, {
        authorId: post.authorId,
        visibility: post.visibility as PostVisibility,
    });

    if (!actorCanView) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // La configuración del dueño del muro es la única política de escritura
    // para SHARED. Ya no se aplica un "solo amigos" adicional.
    const allowedByPolicy = await canUserShareToWall(actorUserId, wallUserId);

    if (!allowedByPolicy) {
        return NextResponse.json(
            { error: "Sharing not allowed by user's settings" },
            { status: 403 }
        );
    }

    // También evitamos crear una entrada que ni el propio dueño del muro
    // podría ver por la visibilidad del Post.
    const wallOwnerCanView = await canViewerSeePost(prisma, wallUserId, {
        authorId: post.authorId,
        visibility: post.visibility as PostVisibility,
    });

    if (!wallOwnerCanView) {
        return NextResponse.json(
            { error: "Wall owner cannot view this post" },
            { status: 403 }
        );
    }

    // Si ese post ya vive de forma normal en ese muro, compartirlo sería
    // una duplicación visual innecesaria.
    const existingPublished = await prisma.wallEntry.findFirst({
        where: {
            wallUserId,
            postId,
            type: "PUBLISHED",
        },
        select: { id: true },
    });

    if (existingPublished) {
        return NextResponse.json(
            { error: "Post already exists on this wall" },
            { status: 409 }
        );
    }

    // Un post se comparte una sola vez por muro, independientemente de quién
    // intente compartirlo. Si el dueño lo ocultó, otro share no puede revivirlo.
    const existingShared = await prisma.wallEntry.findFirst({
        where: {
            wallUserId,
            postId,
            type: "SHARED",
        },
        select: { id: true, active: true },
    });

    if (existingShared) {
        return NextResponse.json(
            {
                error: "Post already shared on this wall",
                wallEntryId: existingShared.id,
            },
            { status: 409 }
        );
    }

    try {
        const entry = await prisma.wallEntry.create({
            data: {
                wallUserId,
                actorUserId,
                postId,
                type: "SHARED",
                showInFeed: false,
                active: 1,
                visibility: 1,
                eventAt: new Date(),
            },
            select: {
                id: true,
                createdAt: true,
                eventAt: true,
                wallUserId: true,
                actorUserId: true,
                postId: true,
                active: true,
                visibility: true,
                showInFeed: true,
            },
        });

        return NextResponse.json({ success: true, entry }, { status: 201 });
    } catch (error) {
        console.error("wall-entry/share failed:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
