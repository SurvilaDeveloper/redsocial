// src/app/api/wall/pin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { canViewerSeePost } from "@/lib/posts/can-view-post";

type Body = {
    postId?: number | string;
    visibility?: 1 | 2 | 3 | 4;
};

function toPostId(value: unknown): number | null {
    const n =
        typeof value === "string"
            ? Number(value)
            : typeof value === "number"
                ? value
                : NaN;

    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
}

async function getVisiblePostForUser(postId: number, viewerId: number) {
    const post = await prisma.post.findFirst({
        where: {
            id: postId,
            active: 1,
            deletedAt: null,
        },
        select: {
            id: true,
            authorId: true,
            visibility: true,
        },
    });

    if (!post) return null;

    const canView = await canViewerSeePost(prisma, viewerId, {
        authorId: post.authorId,
        visibility: post.visibility as PostVisibility,
    });

    return canView ? post : null;
}

export const runtime = "nodejs";

export async function POST(req: Request) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    if (!viewerId) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const postId = toPostId(body?.postId);

    if (postId == null) {
        return NextResponse.json(
            { success: false, error: "Invalid postId" },
            { status: 400 }
        );
    }

    const post = await getVisiblePostForUser(postId, viewerId);

    if (!post) {
        return NextResponse.json(
            { success: false, error: "Post not found or not visible" },
            { status: 404 }
        );
    }

    const nextVisibility =
        body?.visibility === 1 ||
        body?.visibility === 2 ||
        body?.visibility === 3 ||
        body?.visibility === 4
            ? body.visibility
            : undefined;

    const uniqueWhere = {
        wallUserId_actorUserId_postId_type: {
            wallUserId: viewerId,
            actorUserId: viewerId,
            postId,
            type: "PINNED" as const,
        },
    };

    try {
        const existing = await prisma.wallEntry.findUnique({
            where: uniqueWhere,
            select: {
                id: true,
                active: true,
            },
        });

        const now = new Date();

        const wallEntry = await prisma.wallEntry.upsert({
            where: uniqueWhere,
            update: {
                active: 1,
                showInFeed: false,
                eventAt: now,
                ...(nextVisibility != null
                    ? { visibility: nextVisibility }
                    : {}),
            },
            create: {
                wallUserId: viewerId,
                actorUserId: viewerId,
                postId,
                type: "PINNED",
                active: 1,
                visibility: nextVisibility ?? 1,
                showInFeed: false,
                eventAt: now,
            },
            select: {
                id: true,
                type: true,
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

        return NextResponse.json({
            success: true,
            pinned: true,
            alreadyPinned: Boolean(existing && (existing.active ?? 1) === 1),
            wallEntry,
        });
    } catch (error) {
        console.error("wall/pin POST failed:", error);
        return NextResponse.json(
            { success: false, error: "Failed to pin" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    if (!viewerId) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const postId = toPostId(body?.postId);

    if (postId == null) {
        return NextResponse.json(
            { success: false, error: "Invalid postId" },
            { status: 400 }
        );
    }

    try {
        const deleted = await prisma.wallEntry.deleteMany({
            where: {
                wallUserId: viewerId,
                actorUserId: viewerId,
                postId,
                type: "PINNED",
            },
        });

        return NextResponse.json({
            success: true,
            pinned: false,
            removed: deleted.count > 0,
        });
    } catch (error) {
        console.error("wall/pin DELETE failed:", error);
        return NextResponse.json(
            { success: false, error: "Failed to unpin" },
            { status: 500 }
        );
    }
}
