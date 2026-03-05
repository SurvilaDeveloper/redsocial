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

    return rows.map((r) => r.userId);
}

async function queryCvIdsBySection(term: string, type: "skills" | "projects") {
    const like = `%${term}%`;

    const rows = await prisma.$queryRaw<Array<{ userId: number }>>`
        SELECT DISTINCT c.userId
        FROM curriculum c
        JOIN JSON_TABLE(
            c.content,
            '$.sections[*]'
            COLUMNS(
                type VARCHAR(50) PATH '$.type',
                data JSON PATH '$.data'
            )
        ) s
        WHERE c.isPublic = true
        AND s.type = ${type}
        AND CAST(s.data AS CHAR) LIKE ${like}
        LIMIT 200
    `;

    return rows.map((r) => r.userId);
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

    if (q.length < 2) {
        return NextResponse.json({ items: [] });
    }

    let cvMatchedUserIds: number[] | null = null;

    if (mode === "cvcontent" || mode === "all") {
        cvMatchedUserIds = await queryCvIdsByFullContent(q);
    }

    if (mode === "skills") {
        cvMatchedUserIds = await queryCvIdsBySection(q, "skills");
    }

    if (mode === "projects") {
        cvMatchedUserIds = await queryCvIdsBySection(q, "projects");
    }

    const OR: any[] = [];

    if (mode === "all" || mode === "name") {
        OR.push({ name: { contains: q } });
    }

    if (mode === "all" || mode === "nick") {
        OR.push({ nick: { contains: q } });
    }

    if (mode === "all" || mode === "occupation") {
        OR.push({ occupation: { contains: q } });
    }

    if (mode === "all" || mode === "company") {
        OR.push({ company: { contains: q } });
    }

    if (mode === "all" || mode === "location") {
        OR.push(
            { location: { contains: q } },
            { city: { contains: q } },
            { province: { contains: q } },
            { country: { contains: q } }
        );
    }

    if (mode === "all" || mode === "social") {
        OR.push(
            { twitterHandle: { contains: q } },
            { facebookHandle: { contains: q } },
            { instagramHandle: { contains: q } },
            { linkedinHandle: { contains: q } },
            { githubHandle: { contains: q } }
        );
    }

    if (mode === "all" || mode === "cv") {
        OR.push(
            {
                curriculum: {
                    is: {
                        isPublic: true,
                        title: { contains: q },
                    },
                },
            },
            {
                curriculum: {
                    is: {
                        isPublic: true,
                        summary: { contains: q },
                    },
                },
            }
        );
    }

    const whereUser: any = {
        active: 1,
        deletedAt: null,
        id: { not: viewerId },
    };

    if (onlyWithCV) {
        whereUser.curriculum = { is: { isPublic: true } };
    }

    if (cvMatchedUserIds && cvMatchedUserIds.length) {
        whereUser.OR = [...OR, { id: { in: cvMatchedUserIds } }];
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
            curriculum: {
                select: {
                    title: true,
                    summary: true,
                    isPublic: true,
                },
            },
        },
        take: 25,
    });

    if (!users.length) {
        return NextResponse.json({ items: [] });
    }

    const ids = users.map((u) => u.id);

    const follows = await prisma.follow.findMany({
        where: {
            followerId: viewerId,
            followingId: { in: ids },
        },
        select: { followingId: true },
    });

    const followingSet = new Set(follows.map((f) => f.followingId));

    const followsBack = await prisma.follow.findMany({
        where: {
            followerId: { in: ids },
            followingId: viewerId,
        },
        select: { followerId: true },
    });

    const followerSet = new Set(followsBack.map((f) => f.followerId));

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

    function friendStatusFor(targetId: number) {

        const row = friendships.find((f) => {
            const other = f.friend_one === viewerId ? f.friend_two : f.friend_one;
            return other === targetId;
        });

        if (!row) return "none";

        const accepted =
            row.friend_request === FRIEND_REQ_SENT &&
            row.friend_response === FRIEND_RES_ACCEPTED;

        if (accepted) return "friends";

        const viewerIsOne = row.friend_one === viewerId;

        if (row.friend_request === FRIEND_REQ_SENT) {
            return viewerIsOne ? "sent" : "received";
        }

        return "pending";
    }

    const items = users.map((u) => {

        const cv = u.curriculum;

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
            isFollower: followerSet.has(u.id),

            friendStatus: friendStatusFor(u.id),
        };
    });

    return NextResponse.json({ items });
}