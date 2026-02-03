// src/app/api/search/users/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Mode } from "@/components/search/types";

function safeMode(v: string | null): Mode {
    const m = (v ?? "all") as Mode;
    const allowed: Mode[] = [
        "all",
        "name",
        "nick",
        "location",
        "occupation",
        "company",
        "social",
        "cv",
        "cvcontent",
        "skills",
        "projects",
    ];
    return allowed.includes(m) ? m : "all";
}

// Ajustá si tu semántica real difiere:
const FRIEND_REQ_SENT = 1;
const FRIEND_RES_ACCEPTED = 1;

async function queryCvIdsByFullContent(term: string): Promise<number[]> {
    const like = `%${term}%`;

    const rows = await prisma.$queryRaw<Array<{ userId: number }>>`
        SELECT userId
        FROM curriculum
        WHERE isPublic = true
          AND content IS NOT NULL
          AND CAST(content AS CHAR) LIKE ${like}
        LIMIT 200
    `;

    return rows.map((r) => Number(r.userId)).filter((n) => !Number.isNaN(n));
}

async function queryCvIdsBySectionData(
    term: string,
    sectionType: "skills" | "projects"
): Promise<number[]> {
    const like = `%${term}%`;

    // MySQL 8+: JSON_TABLE
    const rows = await prisma.$queryRaw<Array<{ userId: number }>>`
        SELECT DISTINCT c.userId AS userId
        FROM curriculum c
        JOIN JSON_TABLE(
          c.content,
          '$.sections[*]'
          COLUMNS (
            type VARCHAR(64) PATH '$.type',
            data JSON PATH '$.data'
          )
        ) AS s
        WHERE c.isPublic = true
          AND c.content IS NOT NULL
          AND s.type = ${sectionType}
          AND s.data IS NOT NULL
          AND CAST(s.data AS CHAR) LIKE ${like}
        LIMIT 200
    `;

    return rows.map((r) => Number(r.userId)).filter((n) => !Number.isNaN(n));
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const viewerId = Number(session.user.id);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const mode = safeMode(searchParams.get("mode"));
    const onlyWithCV = searchParams.get("onlyWithCV") === "1";

    if (q.length < 2) return NextResponse.json({ items: [] });

    // 1) Filtrado por CV JSON (cuando aplica)
    // - cvcontent: busca en todo el content
    // - skills/projects: busca solo data de esas secciones
    // - all: también busca en todo el content (para que "todo" sea un superset)
    let cvMatchedUserIds: number[] | null = null;

    if (mode === "cvcontent" || mode === "all") {
        cvMatchedUserIds = await queryCvIdsByFullContent(q);
        // en "all" NO hacemos early-return si no hay matches por CV,
        // porque igualmente puede matchear por campos normales
        if (mode === "cvcontent" && cvMatchedUserIds.length === 0) {
            return NextResponse.json({ items: [] });
        }
    }

    if (mode === "skills") {
        cvMatchedUserIds = await queryCvIdsBySectionData(q, "skills");
        if (cvMatchedUserIds.length === 0) return NextResponse.json({ items: [] });
    }

    if (mode === "projects") {
        cvMatchedUserIds = await queryCvIdsBySectionData(q, "projects");
        if (cvMatchedUserIds.length === 0) return NextResponse.json({ items: [] });
    }

    // 2) OR normal (User + CV title/summary)
    const OR: any[] = [];

    const pushAll = () => {
        OR.push(
            { name: { contains: q } },
            { nick: { contains: q } },
            { bio: { contains: q } },
            { location: { contains: q } },
            { city: { contains: q } },
            { province: { contains: q } },
            { country: { contains: q } },
            { occupation: { contains: q } },
            { company: { contains: q } },
            { twitterHandle: { contains: q } },
            { facebookHandle: { contains: q } },
            { instagramHandle: { contains: q } },
            { linkedinHandle: { contains: q } },
            { githubHandle: { contains: q } },
            { curricula: { some: { isPublic: true, title: { contains: q } } } },
            { curricula: { some: { isPublic: true, summary: { contains: q } } } }
        );
    };

    if (mode === "all") pushAll();
    else if (mode === "name") OR.push({ name: { contains: q } });
    else if (mode === "nick") OR.push({ nick: { contains: q } });
    else if (mode === "location")
        OR.push(
            { location: { contains: q } },
            { city: { contains: q } },
            { province: { contains: q } },
            { country: { contains: q } }
        );
    else if (mode === "occupation") OR.push({ occupation: { contains: q } });
    else if (mode === "company") OR.push({ company: { contains: q } });
    else if (mode === "social")
        OR.push(
            { twitterHandle: { contains: q } },
            { facebookHandle: { contains: q } },
            { instagramHandle: { contains: q } },
            { linkedinHandle: { contains: q } },
            { githubHandle: { contains: q } }
        );
    else if (mode === "cv")
        OR.push(
            { curricula: { some: { isPublic: true, title: { contains: q } } } },
            { curricula: { some: { isPublic: true, summary: { contains: q } } } }
        );

    // 3) WHERE final
    const whereUser: any = {
        active: 1,
        deletedAt: null,
        id: { not: viewerId },
    };

    if (onlyWithCV) {
        whereUser.curricula = { some: { isPublic: true } };
    }

    // ✅ Cambio clave:
    // - mode=all => OR (campos normales) OR (id in cvMatchedUserIds)
    // - mode=skills/projects/cvcontent => estricto por ids del CV
    // - el resto => OR normal
    if (mode === "all" && cvMatchedUserIds && cvMatchedUserIds.length > 0) {
        whereUser.OR = [...OR, { id: { in: cvMatchedUserIds } }];
    } else if (cvMatchedUserIds && (mode === "skills" || mode === "projects" || mode === "cvcontent")) {
        whereUser.id = { in: cvMatchedUserIds, not: viewerId };
    } else if (OR.length) {
        whereUser.OR = OR;
    }

    const users = await prisma.user.findMany({
        where: whereUser,
        select: {
            id: true,
            name: true,
            nick: true,
            imageUrl: true,
            location: true,
            city: true,
            province: true,
            country: true,
            occupation: true,
            company: true,
            curricula: {
                where: { isPublic: true },
                select: { title: true, summary: true, isPublic: true },
                take: 1,
            },
        },
        take: 25,
        orderBy: { id: "desc" },
    });

    const ids = users.map((u) => u.id);
    if (ids.length === 0) return NextResponse.json({ items: [] });

    // follows viewer -> targets
    const follows = await prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: ids } },
        select: { followingId: true },
    });
    const followingSet = new Set(follows.map((f) => f.followingId));

    // follows targets -> viewer (te sigue)
    const followsBack = await prisma.follow.findMany({
        where: { followerId: { in: ids }, followingId: viewerId },
        select: { followerId: true },
    });
    const followsBackSet = new Set(followsBack.map((f) => f.followerId));

    // friendships viewer <-> targets
    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { friend_one: viewerId, friend_two: { in: ids } },
                { friend_two: viewerId, friend_one: { in: ids } },
            ],
        },
        select: {
            friend_one: true,
            friend_two: true,
            friend_request: true,
            friend_response: true,
        },
    });

    // viewer friends (for mutual friend)
    const viewerFriendships = await prisma.friendship.findMany({
        where: {
            OR: [{ friend_one: viewerId }, { friend_two: viewerId }],
            friend_request: FRIEND_REQ_SENT,
            friend_response: FRIEND_RES_ACCEPTED,
        },
        select: { friend_one: true, friend_two: true },
    });

    const viewerFriends = new Set<number>();
    for (const fr of viewerFriendships) {
        viewerFriends.add(fr.friend_one === viewerId ? fr.friend_two : fr.friend_one);
    }

    // mutual friend one-per-target
    const acceptedTargetFriendships = viewerFriends.size
        ? await prisma.friendship.findMany({
            where: {
                friend_request: FRIEND_REQ_SENT,
                friend_response: FRIEND_RES_ACCEPTED,
                OR: [
                    { friend_one: { in: ids }, friend_two: { in: Array.from(viewerFriends) } },
                    { friend_two: { in: ids }, friend_one: { in: Array.from(viewerFriends) } },
                ],
            },
            select: { friend_one: true, friend_two: true },
        })
        : [];

    const targetToMutualFriendId = new Map<number, number>();
    for (const fr of acceptedTargetFriendships) {
        const a = fr.friend_one;
        const b = fr.friend_two;

        if (ids.includes(a) && viewerFriends.has(b) && !targetToMutualFriendId.has(a)) {
            targetToMutualFriendId.set(a, b);
        }
        if (ids.includes(b) && viewerFriends.has(a) && !targetToMutualFriendId.has(b)) {
            targetToMutualFriendId.set(b, a);
        }
    }

    const mutualIds = Array.from(new Set(targetToMutualFriendId.values()));
    const mutualUsers = mutualIds.length
        ? await prisma.user.findMany({
            where: { id: { in: mutualIds }, active: 1, deletedAt: null },
            select: { id: true, name: true, nick: true },
        })
        : [];
    const mutualById = new Map(mutualUsers.map((u) => [u.id, u]));

    // COUNTS
    const followerCounts = await prisma.follow.groupBy({
        by: ["followingId"],
        where: { followingId: { in: ids } },
        _count: { _all: true },
    });
    const followingCounts = await prisma.follow.groupBy({
        by: ["followerId"],
        where: { followerId: { in: ids } },
        _count: { _all: true },
    });

    const followersCountMap = new Map(followerCounts.map((r) => [r.followingId, r._count._all]));
    const followingCountMap = new Map(followingCounts.map((r) => [r.followerId, r._count._all]));

    const acceptedForTargets = await prisma.friendship.findMany({
        where: {
            friend_request: FRIEND_REQ_SENT,
            friend_response: FRIEND_RES_ACCEPTED,
            OR: [{ friend_one: { in: ids } }, { friend_two: { in: ids } }],
        },
        select: { friend_one: true, friend_two: true },
    });

    const friendsCountMap = new Map<number, number>();
    for (const fr of acceptedForTargets) {
        friendsCountMap.set(fr.friend_one, (friendsCountMap.get(fr.friend_one) ?? 0) + 1);
        friendsCountMap.set(fr.friend_two, (friendsCountMap.get(fr.friend_two) ?? 0) + 1);
    }

    function friendStatusFor(targetId: number) {
        const row = friendships.find((f) => {
            const other = f.friend_one === viewerId ? f.friend_two : f.friend_one;
            return other === targetId;
        });
        if (!row) return "none" as const;

        const accepted = row.friend_request === FRIEND_REQ_SENT && row.friend_response === FRIEND_RES_ACCEPTED;
        if (accepted) return "friends" as const;

        const viewerIsOne = row.friend_one === viewerId;
        if (row.friend_request === FRIEND_REQ_SENT && row.friend_response !== FRIEND_RES_ACCEPTED) {
            return viewerIsOne ? ("sent" as const) : ("received" as const);
        }

        return "pending" as const;
    }

    const items = users.map((u) => {
        const cv = u.curricula?.[0];

        const mutualFriendId = targetToMutualFriendId.get(u.id);
        const mf = mutualFriendId ? mutualById.get(mutualFriendId) : null;

        return {
            id: u.id,
            name: u.name,
            nick: u.nick,
            imageUrl: u.imageUrl,
            location: u.location,
            city: u.city,
            province: u.province,
            country: u.country,
            occupation: u.occupation,
            company: u.company,
            cvTitle: cv?.title ?? null,
            cvSummary: cv?.summary ?? null,
            hasPublicCV: Boolean(cv?.isPublic),

            isFollowing: followingSet.has(u.id),
            isFollower: followsBackSet.has(u.id),

            friendStatus: friendStatusFor(u.id),
            mutualFriend: mf ? { id: mf.id, name: mf.name, nick: mf.nick } : null,

            followersCount: followersCountMap.get(u.id) ?? 0,
            followingCount: followingCountMap.get(u.id) ?? 0,
            friendsCount: friendsCountMap.get(u.id) ?? 0,
        };
    });

    return NextResponse.json({ items });
}



