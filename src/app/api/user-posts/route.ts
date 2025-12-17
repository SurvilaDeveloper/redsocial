// src/app/api/user-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();

    const viewerId =
        session?.user?.id != null ? parseInt(String(session.user.id), 10) : null;

    const { searchParams } = new URL(req.url);

    const userIdStr = searchParams.get("user_id");
    const userId = userIdStr ? parseInt(userIdStr, 10) : 0;

    const pageStr = searchParams.get("page");
    const page = pageStr ? parseInt(pageStr, 10) : 1;

    const pageSize = 2;

    if (!userId) {
        return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // ✅ MyWall: SOLO el dueño puede pedir sus posts
    if (!viewerId || Number.isNaN(viewerId) || viewerId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    // ✅ Solo posts del owner (incluye active=0 porque es su muro)
    const posts = await prisma.post.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            images: {
                //where: { active: 1 }, // si querés que vea imágenes ocultas también, sacá este where
                orderBy: { index: "asc" },
            },
            user: {
                select: { id: true, name: true, imageUrl: true, imagePublicId: true },
            },
        },
    });

    // ✅ Adaptar al shape de PostCard (Post global)
    const shaped = posts.map((p) => ({
        ...p,
        visibility: (p.visibility ?? 1) as 1 | 2 | 3 | 4,
        active: p.active ?? 1,
        userData: {
            id: p.user.id,
            name: p.user.name,
            imageUrl: p.user.imageUrl,
            imagePublicId: p.user.imagePublicId,
        },
        relations: {
            following: false,
            isFollower: false,
            isFriend: false,
        },
    }));

    return NextResponse.json({ allPosts: shaped });
}



