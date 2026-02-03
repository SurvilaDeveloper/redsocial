// src/app/api/wall-entry/active/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const wallEntryId = Number(body?.wallEntryId);
    const active = Number(body?.active);

    if (!Number.isFinite(wallEntryId) || (active !== 0 && active !== 1)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const entry = await prisma.wallEntry.findUnique({
        where: { id: wallEntryId },
        select: { id: true, wallUserId: true },
    });

    if (!entry) return NextResponse.json({ error: "WallEntry not found" }, { status: 404 });
    if (entry.wallUserId !== viewerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.wallEntry.update({
        where: { id: wallEntryId },
        data: { active },
        select: { id: true, visibility: true, active: true },
    });

    return NextResponse.json({ success: true, wallEntry: updated });
}
