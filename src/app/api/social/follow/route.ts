// src/app/api/social/follow/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const viewerId = Number(session.user.id);

    const body = await req.json().catch(() => null);
    const targetUserId = Number(body?.targetUserId);
    const action = body?.action as "follow" | "unfollow";

    if (!targetUserId || Number.isNaN(targetUserId)) {
        return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });
    }
    if (targetUserId === viewerId) {
        return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    if (action === "follow") {
        await prisma.follow.upsert({
            where: { followerId_followingId: { followerId: viewerId, followingId: targetUserId } },
            create: { followerId: viewerId, followingId: targetUserId },
            update: {},
        });
        return NextResponse.json({ ok: true });
    }

    if (action === "unfollow") {
        await prisma.follow.deleteMany({
            where: { followerId: viewerId, followingId: targetUserId },
        });
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
