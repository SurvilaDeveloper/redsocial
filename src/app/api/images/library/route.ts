// src/app/api/images/library/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

type ImageAsset = {
    publicId: string;
    url: string;
    thumbUrl?: string;
    source: string;
    createdAt?: string;
    active?: boolean; // ✅
    ownerTitle?: string | null;
    ownerId?: number | null;
};

const DELETED_SVG_URL = "/image-deleted.svg";

function isDeletedSvg(url?: string | null) {
    if (!url) return false;
    // soporta por si algún día le agregás querystring
    return url === DELETED_SVG_URL || url.startsWith(`${DELETED_SVG_URL}?`);
}

function shouldSkip(item: ImageAsset) {
    // 1) si la url es el svg de eliminado -> no queremos que aparezca en el picker
    if (isDeletedSvg(item.url)) return true;

    // 2) si está inactiva (cuando venga ese dato) -> tampoco la mostramos en el picker
    //    (si vos quisieras mostrar inactivas en modo preview, sacá esta línea)
    //if (item.active === false) return true;

    return false;
}

function pushUnique(map: Map<string, ImageAsset>, item: ImageAsset) {
    // ✅ filtro global (nadie mete placeholders al picker)
    if (shouldSkip(item)) return;

    // prioriza el primero que tenga thumbUrl
    const prev = map.get(item.publicId);
    if (!prev) {
        map.set(item.publicId, item);
        return;
    }
    if (!prev.thumbUrl && item.thumbUrl) {
        map.set(item.publicId, item);
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Traemos todo en paralelo
    const [user, postsImages, productMedia, serviceMedia, cloudIndex] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                imageUrl: true,
                imagePublicId: true,
                imageWallUrl: true,
                imageWallPublicId: true,
            },
        }),

        prisma.image.findMany({
            // Image pertenece a Post, y Post tiene user_id
            where: { post: { user_id: userId } },
            select: {
                imageUrl: true,
                imagePublicId: true,
                createdAt: true,
                active: true,
                post: { select: { id: true, title: true } }, // ✅
            },
        }),

        prisma.productListingMedia.findMany({
            where: { listing: { user_id: userId } },
            select: {
                url: true,
                publicId: true,
                thumbnailUrl: true,
                thumbnailPublicId: true,
                createdAt: true,
                active: true,
                type: true,
                listing: { select: { id: true, title: true } },
            },
        }),

        prisma.serviceListingMedia.findMany({
            where: { listing: { user_id: userId } },
            select: {
                url: true,
                publicId: true,
                thumbnailUrl: true,
                thumbnailPublicId: true,
                createdAt: true,
                active: true,
                type: true,
                listing: { select: { id: true, title: true } },
            },
        }),

        prisma.cloudinaryImage.findMany({
            where: { userId, deletedAt: null },
            select: { url: true, publicId: true, createdAt: true },
        }),
    ]);

    const map = new Map<string, ImageAsset>();

    // User avatar
    if (user?.imagePublicId && user.imageUrl && !isDeletedSvg(user.imageUrl)) {
        pushUnique(map, {
            publicId: user.imagePublicId,
            url: user.imageUrl,
            source: "user.image",
        });
    }

    // User cover / wall
    if (user?.imageWallPublicId && user.imageWallUrl && !isDeletedSvg(user.imageWallUrl)) {
        pushUnique(map, {
            publicId: user.imageWallPublicId,
            url: user.imageWallUrl,
            source: "user.wall",
        });
    }

    // Posts images
    for (const im of postsImages) {
        if (!im.imagePublicId || !im.imageUrl) continue;
        if (isDeletedSvg(im.imageUrl)) continue;

        pushUnique(map, {
            publicId: im.imagePublicId,
            url: im.imageUrl,
            source: "post.image",
            createdAt: im.createdAt?.toISOString?.(),
            active: im.active == null ? undefined : im.active === 1,
            ownerId: im.post?.id ?? null,
            ownerTitle: im.post?.title ?? null,
        });
    }

    // Product listing media (+ thumbnails)
    for (const m of productMedia) {
        if (m.type !== "image") continue;

        if (m.publicId && m.url && !isDeletedSvg(m.url)) {
            pushUnique(map, {
                publicId: m.publicId,
                url: m.url,
                thumbUrl: m.thumbnailUrl ?? undefined,
                source: "productListing.media",
                createdAt: m.createdAt?.toISOString?.(),
                active: m.active == null ? undefined : m.active === 1,
                ownerId: m.listing?.id ?? null,
                ownerTitle: m.listing?.title ?? null,
            });
        }

        // opcional: indexar también el thumbnail como asset aparte
        if (m.thumbnailPublicId && m.thumbnailUrl && !isDeletedSvg(m.thumbnailUrl)) {
            pushUnique(map, {
                publicId: m.thumbnailPublicId,
                url: m.thumbnailUrl,
                source: "productListing.thumbnail",
                createdAt: m.createdAt?.toISOString?.(),
            });
        }
    }

    // Service listing media (+ thumbnails)
    for (const m of serviceMedia) {
        if (m.type !== "image") continue;

        if (m.publicId && m.url && !isDeletedSvg(m.url)) {
            pushUnique(map, {
                publicId: m.publicId,
                url: m.url,
                thumbUrl: m.thumbnailUrl ?? undefined,
                source: "serviceListing.media",
                createdAt: m.createdAt?.toISOString?.(),
                active: m.active == null ? undefined : m.active === 1,
                ownerId: m.listing?.id ?? null,
                ownerTitle: m.listing?.title ?? null,
            });
        }

        if (m.thumbnailPublicId && m.thumbnailUrl && !isDeletedSvg(m.thumbnailUrl)) {
            pushUnique(map, {
                publicId: m.thumbnailPublicId,
                url: m.thumbnailUrl,
                source: "serviceListing.thumbnail",
                createdAt: m.createdAt?.toISOString?.(),
            });
        }
    }

    // CloudinaryImage index (si ya lo venís usando)
    for (const c of cloudIndex) {
        if (!c.publicId || !c.url) continue;
        if (isDeletedSvg(c.url)) continue;

        pushUnique(map, {
            publicId: c.publicId,
            url: c.url,
            source: "cloudinary.index",
            createdAt: c.createdAt?.toISOString?.(),
        });
    }

    // orden simple: más nuevo primero si hay createdAt
    const images = Array.from(map.values()).sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
    });

    return NextResponse.json({ images });
}

