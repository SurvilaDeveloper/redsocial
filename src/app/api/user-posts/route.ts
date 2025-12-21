// src/app/api/user-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type PostReaction = "LIKE" | "UNLIKE" | null;

export async function GET(req: NextRequest) {
    const session = await auth();

    const viewerId =
        session?.user?.id != null ? parseInt(String(session.user.id), 10) : null;

    const { searchParams } = new URL(req.url);

    const userIdStr = searchParams.get("user_id");
    const userId = userIdStr ? parseInt(userIdStr, 10) : 0;

    const pageStr = searchParams.get("page");
    const page = pageStr ? parseInt(pageStr, 10) : 1;

    const pageSize = 2; // igual que antes

    if (!userId) {
        return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 }
        );
    }

    // ✅ MyWall: SOLO el dueño puede pedir sus posts
    if (!viewerId || Number.isNaN(viewerId) || viewerId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Solo posts del owner (puede ver activos e inactivos)
    const posts = await prisma.post.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            images: {
                // si querés que vea solo imágenes activas, descomentá el where
                // where: { active: 1 },
                orderBy: { index: "asc" },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    imagePublicId: true,
                },
            },
            // Sólo necesitamos los ids para contar comentarios activos
            post_comment: {
                where: { active: 1 },
                select: { id: true },
            },
            _count: {
                select: {
                    post_like: true,
                    post_unlike: true,
                },
            },
            ...(viewerId && {
                post_like: {
                    where: { userId: viewerId },
                    select: { id: true },
                },
                post_unlike: {
                    where: { userId: viewerId },
                    select: { id: true },
                },
            }),
        },
    });

    // ✅ Adaptar al mismo shape que usa el feed (/api/last-posts)
    const shaped = posts.map((p) => {
        const pAny = p as any;

        // --- Reacciones del post ---
        const likesCount: number = pAny._count?.post_like ?? 0;
        const unlikesCount: number = pAny._count?.post_unlike ?? 0;

        let userReaction: PostReaction = null;
        if (viewerId) {
            const liked =
                Array.isArray(pAny.post_like) && pAny.post_like.length > 0;
            const unliked =
                Array.isArray(pAny.post_unlike) && pAny.post_unlike.length > 0;

            if (liked) userReaction = "LIKE";
            else if (unliked) userReaction = "UNLIKE";
        }

        // --- Cantidad de comentarios activos ---
        const commentsCount = (p.post_comment ?? []).length;

        return {
            ...p,
            visibility: (p.visibility ?? 1) as 1 | 2 | 3 | 4,
            active: p.active ?? 1,

            // lo que esperan los PostCard
            userData: {
                id: p.user.id,
                name: p.user.name,
                imageUrl: p.user.imageUrl,
                imagePublicId: p.user.imagePublicId,
            },

            // images ya viene con la forma básica que espera `Post.images`
            images: (p.images ?? []).map((img) => ({
                id: img.id,
                post_id: img.post_id,
                imageUrl: img.imageUrl,
                imagePublicId: img.imagePublicId,
                index: img.index,
                active: img.active ?? 1,
            })),

            relations: {
                // en tu propio muro estas flags no importan
                following: false,
                isFollower: false,
                isFriend: false,
                likesCount,
                unlikesCount,
                userReaction,
            },

            commentsCount, // 👈 para mostrar el número en variant="card"
        };
    });

    return NextResponse.json({ allPosts: shaped });
}




