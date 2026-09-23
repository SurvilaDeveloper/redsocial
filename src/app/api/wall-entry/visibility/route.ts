// src/app/api/wall-entry/visibility/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeVisibility } from "@/lib/wall-entry-visibility";
import {
    isOwnOriginalPublishedWallEntry,
    OWN_PUBLISHED_WALL_ENTRY_STATE,
} from "@/lib/wall-entry-rules";

export const runtime = "nodejs";

export async function POST(req: Request) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    if (!viewerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const wallEntryId = Number(body?.wallEntryId);
    const rawVisibility = Number(body?.visibility);

    if (
        !Number.isFinite(wallEntryId) ||
        (rawVisibility !== 1 &&
            rawVisibility !== 2 &&
            rawVisibility !== 3 &&
            rawVisibility !== 4)
    ) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const visibility = normalizeVisibility(rawVisibility);

    const entry = await prisma.wallEntry.findUnique({
        where: { id: wallEntryId },
        select: {
            id: true,
            wallUserId: true,
            actorUserId: true,
            type: true,
            post: {
                select: {
                    authorId: true,
                },
            },
        },
    });

    if (!entry) {
        return NextResponse.json({ error: "WallEntry not found" }, { status: 404 });
    }

    if (entry.wallUserId !== viewerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ownOriginal = isOwnOriginalPublishedWallEntry({
        type: entry.type,
        wallUserId: entry.wallUserId,
        actorUserId: entry.actorUserId,
        postAuthorId: entry.post.authorId,
    });

    // La visibilidad de la publicación original propia vive en Post.visibility.
    if (ownOriginal) {
        const repaired = await prisma.wallEntry.update({
            where: { id: wallEntryId },
            data: OWN_PUBLISHED_WALL_ENTRY_STATE,
            select: {
                id: true,
                visibility: true,
                active: true,
                showInFeed: true,
            },
        });

        return NextResponse.json({
            success: true,
            lockedToPost: true,
            wallEntry: repaired,
        });
    }

    const updated = await prisma.wallEntry.update({
        where: { id: wallEntryId },
        data: { visibility },
        select: {
            id: true,
            visibility: true,
            active: true,
            showInFeed: true,
        },
    });

    return NextResponse.json({ success: true, wallEntry: updated });
}
