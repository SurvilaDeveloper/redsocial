// src/app/api/listings/covers/route.ts
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

    // 1 público
    if (v === 1) return true;

    // 2 logueados
    if (v === 2) return opts.viewerId != null;

    // 3 seguidores/amigos
    if (v === 3) return opts.viewerId != null && (opts.isFriend || opts.isFollower);

    // 4 solo amigos
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

function normalizeIds(raw: any): number[] {
    const arr = Array.isArray(raw) ? raw : [];
    const out: number[] = [];
    const seen = new Set<number>();

    for (const v of arr) {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) continue;
        if (seen.has(n)) continue;
        seen.add(n);
        out.push(n);
        if (out.length >= 60) break; // límite razonable
    }
    return out;
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const type = String((body as any).type ?? "") as ListingType;
        if (type !== "product" && type !== "service") {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const ids = normalizeIds((body as any).ids);
        if (ids.length === 0) {
            return NextResponse.json({ ok: true, items: [] });
        }

        // Traemos lo mínimo: owner, active, visibility, y 1ra media activa
        if (type === "product") {
            const rows = await prisma.productListing.findMany({
                where: { id: { in: ids } },
                select: {
                    id: true,
                    user_id: true,
                    active: true,
                    visibility: true,
                    media: {
                        where: { active: 1 },
                        orderBy: { index: "asc" },
                        take: 1,
                        select: {
                            thumbnailUrl: true,
                            url: true,
                        },
                    },
                },
            });

            // Cache relations por ownerId (evita queries repetidas)
            const relCache = new Map<number, { isFriend: boolean; isFollower: boolean }>();

            const items: Array<{ id: number; coverUrl: string | null }> = [];

            for (const r of rows) {
                const isOwner = viewerId != null && viewerId === r.user_id;

                // moderación: si no sos dueño y active != 1 => no mostramos nada
                if (!isOwner && r.active !== 1) continue;

                let rel = relCache.get(r.user_id);
                if (!rel) {
                    const friend = viewerId ? await isFriend(viewerId, r.user_id) : false;
                    const follower = viewerId ? await isFollower(viewerId, r.user_id) : false;
                    rel = { isFriend: friend, isFollower: follower };
                    relCache.set(r.user_id, rel);
                }

                const ok = canViewByVisibility({
                    visibility: r.visibility,
                    viewerId,
                    ownerId: r.user_id,
                    isFriend: rel.isFriend,
                    isFollower: rel.isFollower,
                });

                if (!ok) continue;

                const m = r.media?.[0] ?? null;
                const coverUrl = (m?.thumbnailUrl ?? m?.url) ?? null;

                items.push({ id: r.id, coverUrl });
            }

            return NextResponse.json({ ok: true, items });
        }

        // service
        const rows = await prisma.serviceListing.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                user_id: true,
                active: true,
                visibility: true,
                media: {
                    where: { active: 1 },
                    orderBy: { index: "asc" },
                    take: 1,
                    select: {
                        thumbnailUrl: true,
                        url: true,
                    },
                },
            },
        });

        const relCache = new Map<number, { isFriend: boolean; isFollower: boolean }>();

        const items: Array<{ id: number; coverUrl: string | null }> = [];

        for (const r of rows) {
            const isOwner = viewerId != null && viewerId === r.user_id;

            if (!isOwner && r.active !== 1) continue;

            let rel = relCache.get(r.user_id);
            if (!rel) {
                const friend = viewerId ? await isFriend(viewerId, r.user_id) : false;
                const follower = viewerId ? await isFollower(viewerId, r.user_id) : false;
                rel = { isFriend: friend, isFollower: follower };
                relCache.set(r.user_id, rel);
            }

            const ok = canViewByVisibility({
                visibility: r.visibility,
                viewerId,
                ownerId: r.user_id,
                isFriend: rel.isFriend,
                isFollower: rel.isFollower,
            });

            if (!ok) continue;

            const m = r.media?.[0] ?? null;
            const coverUrl = (m?.thumbnailUrl ?? m?.url) ?? null;

            items.push({ id: r.id, coverUrl });
        }

        return NextResponse.json({ ok: true, items });
    } catch (err) {
        console.error("POST /api/listings/covers error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
