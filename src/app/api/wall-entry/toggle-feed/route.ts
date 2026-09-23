// src/app/api/wall-entry/toggle-feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import {
    isOwnOriginalPublishedWallEntry,
    OWN_PUBLISHED_WALL_ENTRY_STATE,
} from "@/lib/wall-entry-rules";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    if (!viewerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const wallEntryId = Number(body?.wallEntryId);

    if (!Number.isFinite(wallEntryId)) {
        return NextResponse.json(
            { error: "wallEntryId is required" },
            { status: 400 }
        );
    }

    const entry = await prisma.wallEntry.findUnique({
        where: { id: wallEntryId },
        select: {
            id: true,
            wallUserId: true,
            actorUserId: true,
            type: true,
            showInFeed: true,
            active: true,
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

    // La publicación original propia siempre es candidata al feed.
    // Si no aparece, la decisión debe venir de Post.active/deletedAt/visibility.
    if (ownOriginal) {
        const repaired = await prisma.wallEntry.update({
            where: { id: wallEntryId },
            data: OWN_PUBLISHED_WALL_ENTRY_STATE,
            select: {
                id: true,
                showInFeed: true,
                active: true,
                visibility: true,
            },
        });

        return NextResponse.json({
            success: true,
            lockedToPost: true,
            wallEntryId: repaired.id,
            showInFeed: repaired.showInFeed,
        });
    }

    // PINNED pertenece al muro, no al feed principal.
    if (entry.type === "PINNED") {
        if (entry.showInFeed) {
            await prisma.wallEntry.update({
                where: { id: wallEntryId },
                data: { showInFeed: false },
            });
        }

        return NextResponse.json({
            success: true,
            lockedToWall: true,
            wallEntryId: entry.id,
            showInFeed: false,
        });
    }

    if ((entry.active ?? 1) !== 1) {
        return NextResponse.json({ error: "WallEntry is inactive" }, { status: 409 });
    }

    const nextValue = !entry.showInFeed;

    const updated = await prisma.wallEntry.update({
        where: { id: wallEntryId },
        data: { showInFeed: nextValue },
        select: { id: true, showInFeed: true },
    });

    return NextResponse.json({
        success: true,
        wallEntryId: updated.id,
        showInFeed: updated.showInFeed,
    });
}
