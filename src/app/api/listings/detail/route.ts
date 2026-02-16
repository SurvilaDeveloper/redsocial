// src/app/api/listings/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Reglas de visibilidad (tu sistema):
 * 0 = solo dueño
 * 1 = público
 * 2 = logueados
 * 3 = seguidores/amigos
 * 4 = solo amigos
 */
function canViewByVisibility(opts: {
    visibility: number | null | undefined;
    viewerId: number | null;
    ownerId: number;
    isFriend: boolean;
    isFollower: boolean;
}) {
    const v = Number(opts.visibility ?? 1);

    // ✅ owner ve todo (incluye visibility=0)
    if (opts.viewerId != null && opts.viewerId === opts.ownerId) return true;

    // ✅ visibility == 0: solo dueño
    if (v === 0) return false;

    if (v === 1) return true; // público
    if (v === 2) return opts.viewerId != null; // logueados
    if (v === 3) return opts.viewerId != null && (opts.isFriend || opts.isFollower); // seg/amigos
    if (v === 4) return opts.viewerId != null && opts.isFriend; // amigos

    return false;
}

async function getViewerId() {
    const session = await auth();
    return session?.user?.id != null ? Number(session.user.id) : null;
}

function parseParams(req: NextRequest) {
    const url = new URL(req.url);
    const typeRaw = String(url.searchParams.get("type") ?? "");
    const type = typeRaw === "product" || typeRaw === "service" ? typeRaw : null;

    const idRaw = url.searchParams.get("id");
    const id = Number(idRaw);

    return { type, id };
}

async function getSocialState(viewerId: number | null, ownerId: number) {
    if (!viewerId) return { isFriend: false, isFollower: false };

    const [friendRow, followerRow] = await Promise.all([
        prisma.friendship.findFirst({
            where: {
                OR: [
                    { friend_one: viewerId, friend_two: ownerId },
                    { friend_one: ownerId, friend_two: viewerId },
                ],
                friend_request: 1,
                friend_response: 1,
            },
            select: { id: true },
        }),
        prisma.follow.findFirst({
            where: { followerId: viewerId, followingId: ownerId },
            select: { id: true },
        }),
    ]);

    return { isFriend: !!friendRow, isFollower: !!followerRow };
}

function normalizePrice(price: any) {
    return price != null ? String(price) : null;
}

function coverUrlFromMedia(media: Array<{ type: string; thumbnailUrl: string | null; url: string | null }>) {
    if (!Array.isArray(media) || media.length === 0) return null;
    const first = media[0];
    // si es video y tiene thumb, usamos thumb; sino url
    return (first.thumbnailUrl ?? first.url) ?? null;
}

async function fetchProductListing(id: number) {
    return prisma.productListing.findUnique({
        where: { id },
        select: {
            id: true,
            user_id: true,
            title: true,
            description: true,
            clarifications: true,
            price: true,
            currency: true,
            active: true,
            visibility: true,
            createdAt: true,
            media: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                take: 6,
                select: {
                    id: true,
                    type: true,
                    url: true,
                    thumbnailUrl: true,
                    publicId: true,
                    thumbnailPublicId: true,
                    durationSec: true,
                    format: true,
                    index: true,
                    active: true,
                },
            },
        },
    });
}

async function fetchServiceListing(id: number) {
    return prisma.serviceListing.findUnique({
        where: { id },
        select: {
            id: true,
            user_id: true,
            title: true,
            description: true,
            clarifications: true,
            price: true,
            currency: true,
            durationMinutes: true,
            modality: true,
            location: true,
            active: true,
            visibility: true,
            createdAt: true,
            media: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                take: 6,
                select: {
                    id: true,
                    type: true,
                    url: true,
                    thumbnailUrl: true,
                    publicId: true,
                    thumbnailPublicId: true,
                    durationSec: true,
                    format: true,
                    index: true,
                    active: true,
                },
            },
        },
    });
}

function requireModerationVisibility(opts: { viewerId: number | null; ownerId: number; active: number | null | undefined }) {
    const isOwner = opts.viewerId != null && opts.viewerId === opts.ownerId;
    if (isOwner) return { ok: true as const, isOwner: true as const };

    // moderación: si no sos dueño y active != 1 => oculto como 404
    if (Number(opts.active ?? 1) !== 1) return { ok: false as const, status: 404 as const };

    return { ok: true as const, isOwner: false as const };
}

export async function GET(req: NextRequest) {
    try {
        const viewerId = await getViewerId();
        const { type, id } = parseParams(req);

        if (!type) {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        if (type === "product") {
            const listing = await fetchProductListing(id);
            if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

            const mod = requireModerationVisibility({
                viewerId,
                ownerId: listing.user_id,
                active: listing.active,
            });
            if (!mod.ok) return NextResponse.json({ error: "Not found" }, { status: mod.status });

            const social = await getSocialState(viewerId, listing.user_id);

            const ok = canViewByVisibility({
                visibility: listing.visibility,
                viewerId,
                ownerId: listing.user_id,
                isFriend: social.isFriend,
                isFollower: social.isFollower,
            });

            if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

            return NextResponse.json({
                ok: true,
                type: "product",
                listing: {
                    ...listing,
                    price: normalizePrice(listing.price),
                    // ✅ útil para mini-card: primera imagen/video thumb
                    coverUrl: coverUrlFromMedia(listing.media as any),
                },
            });
        }

        // service
        const listing = await fetchServiceListing(id);
        if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const mod = requireModerationVisibility({
            viewerId,
            ownerId: listing.user_id,
            active: listing.active,
        });
        if (!mod.ok) return NextResponse.json({ error: "Not found" }, { status: mod.status });

        const social = await getSocialState(viewerId, listing.user_id);

        const ok = canViewByVisibility({
            visibility: listing.visibility,
            viewerId,
            ownerId: listing.user_id,
            isFriend: social.isFriend,
            isFollower: social.isFollower,
        });

        if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        return NextResponse.json({
            ok: true,
            type: "service",
            listing: {
                ...listing,
                price: normalizePrice(listing.price),
                coverUrl: coverUrlFromMedia(listing.media as any),
            },
        });
    } catch (err) {
        console.error("GET /api/listings/detail error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

