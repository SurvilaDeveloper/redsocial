// src/app/api/wall-entry/toggle-feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const wallEntryId = Number(body?.wallEntryId);

    if (!Number.isFinite(wallEntryId)) {
        return NextResponse.json({ error: "wallEntryId is required" }, { status: 400 });
    }

    const entry = await prisma.wallEntry.findUnique({
        where: { id: wallEntryId },
        select: {
            id: true,
            wallUserId: true,
            actorUserId: true,
            type: true,
            showInFeed: true, // ✅ boolean
            active: true,
        },
    });

    if (!entry || (entry.active ?? 1) !== 1) {
        return NextResponse.json({ error: "WallEntry not found" }, { status: 404 });
    }

    // ✅ solo dueño del muro
    if (entry.wallUserId !== viewerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ solo tiene sentido para posts publicados por terceros
    if (entry.actorUserId === entry.wallUserId) {
        return NextResponse.json({ error: "Nothing to toggle for own entries" }, { status: 400 });
    }

    const nextValue = !entry.showInFeed;

    const updated = await prisma.wallEntry.update({
        where: { id: wallEntryId },
        data: { showInFeed: nextValue }, // ✅ boolean
        select: { id: true, showInFeed: true },
    });

    return NextResponse.json({
        success: true,
        wallEntryId: updated.id,
        showInFeed: updated.showInFeed,
    });
}

