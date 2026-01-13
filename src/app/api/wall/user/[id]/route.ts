// src/app/api/wall/user/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { getRelationshipState } from "@/lib/relationship";

type CvMeta = {
    exists: boolean;
    id: number | null;
    isPublic: boolean;
    canView: boolean;
};

function buildCvMeta(
    cv: { id: number; isPublic: boolean } | null,
    opts: { isOwner: boolean }
): CvMeta {
    if (!cv) {
        return { exists: false, id: null, isPublic: false, canView: false };
    }

    const isPublic = Boolean(cv.isPublic);
    const canView = opts.isOwner ? true : isPublic;

    return {
        exists: true,
        id: cv.id,
        isPublic,
        canView,
    };
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

        const wallUserId = Number((await params).id);
        if (Number.isNaN(wallUserId)) {
            return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
        }

        // 🔹 Traer información del usuario
        const user = await prisma.user.findUnique({
            where: { id: wallUserId },
            select: {
                id: true,
                name: true,
                nick: true,
                bio: true,
                imageUrl: true,
                imageWallUrl: true,
                wallHeaderBackgroundColor: true,
                wallHeaderBackgroundType: true,
                occupation: true,
                company: true,
                location: true,
                country: true,
                province: true,
                website: true,
                twitterHandle: true,
                facebookHandle: true,
                instagramHandle: true,
                linkedinHandle: true,
                githubHandle: true,
                visibility: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // ✅ CV meta (lookup mínimo, no trae contenido)
        const cvRow = await prisma.curriculum.findUnique({
            where: { userId: wallUserId },
            select: { id: true, isPublic: true },
        });

        const isOwner = sessionUserId === user.id;
        const visibility = user.visibility ?? 1;

        // 🔐 Owner puede ver todo (y puede ver su CV aunque no sea público)
        if (isOwner) {
            return NextResponse.json({
                user,
                meta: {
                    isOwner: true,
                    isFriend: false,
                    isFollower: false,
                    visibility,
                    cv: buildCvMeta(cvRow, { isOwner: true }),
                },
            });
        }

        // 1️⃣ Público
        if (visibility === 1) {
            return NextResponse.json({
                user,
                meta: {
                    isOwner: false,
                    visibility,
                    cv: buildCvMeta(cvRow, { isOwner: false }),
                },
            });
        }

        // 2️⃣ Solo logueados
        if (visibility === 2) {
            if (!sessionUserId) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.json({
                user,
                meta: {
                    isOwner: false,
                    visibility,
                    cv: buildCvMeta(cvRow, { isOwner: false }),
                },
            });
        }

        // A partir de aquí se requiere sesión
        if (!sessionUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 🤝 Estado de amistad usando helper
        const relState = await getRelationshipState(sessionUserId, user.id);
        const isFriend = relState === 8;

        // 👥 Estado de seguimiento
        const isFollower = Boolean(
            await prisma.follow.findFirst({
                where: { followerId: sessionUserId, followingId: user.id },
                select: { id: true },
            })
        );

        // 3️⃣ Seguidores o amigos
        if (visibility === 3) {
            if (!isFriend && !isFollower) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return NextResponse.json({
                user,
                meta: {
                    isOwner: false,
                    isFriend,
                    isFollower,
                    visibility,
                    cv: buildCvMeta(cvRow, { isOwner: false }),
                },
            });
        }

        // 4️⃣ Solo amigos
        if (visibility === 4) {
            if (!isFriend) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return NextResponse.json({
                user,
                meta: {
                    isOwner: false,
                    isFriend: true,
                    isFollower,
                    visibility,
                    cv: buildCvMeta(cvRow, { isOwner: false }),
                },
            });
        }

        // fallback
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}




