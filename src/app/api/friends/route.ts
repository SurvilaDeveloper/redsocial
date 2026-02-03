// src/app/api/friends/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;
    if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = Math.min(Number(searchParams.get("limit") ?? 30) || 30, 100);

    // 1) ids amigos
    const rows = await prisma.friendship.findMany({
        where: {
            friend_one: viewerId,
            friend_request: 1,
            friend_response: 1,
        },
        select: { friend_two: true },
        take: 500, // para tener margen si luego filtrás por q
    });

    const friendIds = rows.map(r => r.friend_two);
    if (!friendIds.length) return NextResponse.json({ friends: [] });

    // 2) users
    const friends = await prisma.user.findMany({
        where: {
            id: { in: friendIds },
            ...(q
                ? { name: { contains: q, mode: "insensitive" } }
                : {}),
        },
        select: {
            id: true,
            name: true,
            imageUrl: true,
            imagePublicId: true,
            image: true,
        },
        orderBy: { name: "asc" },
        take: limit,
    });

    return NextResponse.json({ friends });
}
