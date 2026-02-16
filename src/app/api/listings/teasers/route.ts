// src/app/api/listings/teasers/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

type ListingType = "product" | "service";

function canViewByVisibility(opts: {
    visibility: number | null | undefined;
    viewerId: number | null;
    ownerId: number;
    isFriend: boolean;
    isFollower: boolean;
}) {
    const v = Number(opts.visibility ?? 1);

    // owner ve todo
    if (opts.viewerId != null && opts.viewerId === opts.ownerId) return true;

    // visibility==0: solo dueño
    if (v === 0) return false;

    if (v === 1) return true;
    if (v === 2) return opts.viewerId != null;
    if (v === 3) return opts.viewerId != null && (opts.isFriend || opts.isFollower);
    if (v === 4) return opts.viewerId != null && opts.isFriend;

    return false;
}

async function isFriend(viewerId: number, ownerId: number) {
    const row = await prisma.friendship.findFirst({
        where: {
            OR: [
                { friend_one: viewerId, friend_two: ownerId },
                { friend_one: ownerId, friend_two: viewerId },
            ],
            friend_request: 1,
            friend_response: 1,
        },
        select: { id: true },
    });
    return !!row;
}

async function isFollower(viewerId: number, ownerId: number) {
    const row = await prisma.follow.findFirst({
        where: { followerId: viewerId, followingId: ownerId },
        select: { id: true },
    });
    return !!row;
}

function parseType(raw: unknown): ListingType | null {
    const t = String(raw ?? "").trim();
    if (t === "product" || t === "service") return t;
    return null;
}

function parseIds(raw: unknown): number[] {
    if (!Array.isArray(raw)) return [];
    const out: number[] = [];

    for (const x of raw) {
        const n = Number(x);
        if (Number.isFinite(n) && n > 0) out.push(Math.trunc(n));
    }

    return Array.from(new Set(out)).slice(0, 50);
}

async function buildSocialMaps(viewerId: number | null, ownerIds: number[]) {
    const friendMap = new Map<number, boolean>();
    const followerMap = new Map<number, boolean>();

    if (viewerId == null) return { friendMap, followerMap };

    await Promise.all(
        ownerIds.map(async (oid) => {
            const [fr, fo] = await Promise.all([isFriend(viewerId, oid), isFollower(viewerId, oid)]);
            friendMap.set(oid, fr);
            followerMap.set(oid, fo);
        })
    );

    return { friendMap, followerMap };
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

        const body: unknown = await req.json().catch(() => null);

        const type = parseType((body as any)?.type);
        if (!type) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

        const ids = parseIds((body as any)?.ids);
        if (ids.length === 0) return NextResponse.json({ ok: true, items: [] });

        if (type === "product") {
            const rows = await prisma.productListing.findMany({
                where: { id: { in: ids }, deletedAt: null },
                select: {
                    id: true,
                    user_id: true,
                    active: true,
                    visibility: true,
                    media: {
                        where: { active: 1 },
                        orderBy: { index: "asc" },
                        take: 1,
                        select: { thumbnailUrl: true, url: true },
                    },
                },
            });

            const ownerIds = Array.from(new Set(rows.map((r) => r.user_id)));
            const { friendMap, followerMap } = await buildSocialMaps(viewerId, ownerIds);

            const items = rows
                .filter((r) => {
                    const isOwner = viewerId != null && viewerId === r.user_id;
                    if (!isOwner && r.active !== 1) return false;

                    return canViewByVisibility({
                        visibility: r.visibility,
                        viewerId,
                        ownerId: r.user_id,
                        isFriend: friendMap.get(r.user_id) ?? false,
                        isFollower: followerMap.get(r.user_id) ?? false,
                    });
                })
                .map((r) => ({
                    id: r.id,
                    thumbUrl: r.media?.[0]?.thumbnailUrl ?? r.media?.[0]?.url ?? null,
                }));

            return NextResponse.json({ ok: true, items });
        }

        // service (si tu schema ya tiene ServiceListingMedia y relación media)
        const rows = await prisma.serviceListing.findMany({
            where: { id: { in: ids }, deletedAt: null },
            select: {
                id: true,
                user_id: true,
                active: true,
                visibility: true,
                media: {
                    where: { active: 1 },
                    orderBy: { index: "asc" },
                    take: 1,
                    select: { thumbnailUrl: true, url: true },
                },
            },
        });

        const ownerIds = Array.from(new Set(rows.map((r) => r.user_id)));
        const { friendMap, followerMap } = await buildSocialMaps(viewerId, ownerIds);

        const items = rows
            .filter((r) => {
                const isOwner = viewerId != null && viewerId === r.user_id;
                if (!isOwner && r.active !== 1) return false;

                return canViewByVisibility({
                    visibility: r.visibility,
                    viewerId,
                    ownerId: r.user_id,
                    isFriend: friendMap.get(r.user_id) ?? false,
                    isFollower: followerMap.get(r.user_id) ?? false,
                });
            })
            .map((r) => ({
                id: r.id,
                thumbUrl: r.media?.[0]?.thumbnailUrl ?? r.media?.[0]?.url ?? null,
            }));

        return NextResponse.json({ ok: true, items });
    } catch (err) {
        console.error("POST /api/listings/teasers error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

