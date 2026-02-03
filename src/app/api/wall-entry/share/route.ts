// src/app/api/wall-entry/share/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewerSeePost } from "@/lib/posts/can-view-post";
import { RelationshipState } from "@/lib/relationship-state";
import { getUserRelations } from "@/lib/relations";

type Body = {
    postId: number;
    wallUserId: number;
};

// ✅ postsWhoCanShare: 1 nadie, 2 amigos, 3 followers+amigos, 4 logueados
async function canShareToWall({
    wallUserId,
    actorUserId,
}: {
    wallUserId: number;
    actorUserId: number;
}) {
    if (wallUserId === actorUserId) return true;

    const cfg = await prisma.configuration.findUnique({
        where: { userId: wallUserId },
        select: { postsWhoCanShare: true },
    });

    const policy = cfg?.postsWhoCanShare ?? 2;

    if (policy === 1) return false;
    if (policy === 4) return true;

    const rel = await getUserRelations(actorUserId, wallUserId, prisma);
    const isFriend = rel.relState === RelationshipState.FRIENDS;

    if (policy === 2) return isFriend;

    if (policy === 3) {
        // amigos o following
        return isFriend || rel.following;
    }

    return false;
}

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

    if (!Number.isFinite(postId) || !Number.isFinite(wallUserId)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1) post existe y está activo
    const post = await prisma.post.findFirst({
        where: { id: postId, deletedAt: null, active: 1 },
        select: { id: true, authorId: true, visibility: true },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 2) actor puede ver el post
    const canView = await canViewerSeePost(prisma, actorUserId, {
        authorId: post.authorId,
        visibility: post.visibility as PostVisibility,
    });
    if (!canView) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) estricto: solo amigos para compartir en muro ajeno
    if (wallUserId !== actorUserId) {
        const relToWallOwner = await getUserRelations(actorUserId, wallUserId, prisma);
        const isFriend = relToWallOwner.relState === RelationshipState.FRIENDS;
        if (!isFriend) {
            return NextResponse.json(
                { error: "Only friends can share to this wall" },
                { status: 403 }
            );
        }
    }

    // 4) el dueño del muro permite compartir
    const allowedByPolicy = await canShareToWall({ wallUserId, actorUserId });
    if (!allowedByPolicy) {
        return NextResponse.json(
            { error: "Sharing not allowed by user's settings" },
            { status: 403 }
        );
    }

    // 5) crear o “re-share” (si ya existe) => update eventAt sin tocar createdAt
    const now = new Date();

    try {
        const entry = await prisma.wallEntry.upsert({
            where: {
                wallUserId_actorUserId_postId_type: {
                    wallUserId,
                    actorUserId,
                    postId,
                    type: "SHARED",
                },
            },
            create: {
                wallUserId,
                actorUserId,
                postId,
                type: "SHARED",
                showInFeed: false,
                active: 1,
                visibility: 1, // default “en ese muro” (si querés heredar/parametrizar, lo ajustamos)
                eventAt: now,
            },
            update: {
                eventAt: now,
                active: 1,
            },
            select: { id: true, createdAt: true, eventAt: true, wallUserId: true, actorUserId: true, postId: true },
        });

        return NextResponse.json({ success: true, entry }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}


