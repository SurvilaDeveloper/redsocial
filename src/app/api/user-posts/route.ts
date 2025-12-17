import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("user_id") ?? 0);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = 2;

    if (!userId) return NextResponse.json({ error: "user_id is required" }, { status: 400 });

    // ✅ MyWall: solo el dueño
    if (!viewerId || viewerId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const posts = await prisma.post.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            images: {
                //where: { active: 1 },          // 👈 solo imágenes activas (ajustalo si querés ver también ocultas)
                orderBy: { index: "asc" },
            },
            user: {
                select: { id: true, name: true, imageUrl: true, imagePublicId: true },
            },
        },
    });

    const shaped = posts.map((p) => ({
        ...p,
        visibility: (p.visibility ?? 1) as 1 | 2 | 3 | 4,
        userData: {
            id: p.user.id,
            name: p.user.name,
            imageUrl: p.user.imageUrl,
            imagePublicId: p.user.imagePublicId,
        },
        relations: { following: false, isFollower: false, isFriend: false },
    }));

    return NextResponse.json({ allPosts: shaped });
}


