// src/app/api/media/by-ids/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_IDS = 200;

const BodySchema = z.object({
    ids: z.array(z.number().int().positive()).max(MAX_IDS),
});

// Para GET ?ids=1,2,3
const QuerySchema = z.object({
    ids: z.string().min(1).max(5000), // límite razonable de querystring
});

function uniquePositiveInts(input: number[]) {
    const set = new Set<number>();
    for (const n of input) {
        const v = Number(n);
        if (Number.isFinite(v) && v > 0) set.add(v | 0);
        if (set.size >= MAX_IDS) break;
    }
    return Array.from(set);
}

async function requireUserId() {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return null;
    return userId;
}

export async function GET(req: NextRequest) {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const raw = url.searchParams.get("ids") ?? "";

    const parsedQ = QuerySchema.safeParse({ ids: raw });
    if (!parsedQ.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

    const ids = uniquePositiveInts(
        raw
            .split(",")
            .map((s) => Number(String(s).trim()))
            .filter((n) => Number.isFinite(n) && n > 0)
    );

    if (ids.length === 0) return NextResponse.json({ items: [] });

    const items = await prisma.cloudinaryImage.findMany({
        where: {
            id: { in: ids },
            userId,
            deletedAt: null,
        },
        select: { id: true, url: true, publicId: true },
    });

    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const ids = uniquePositiveInts(parsed.data.ids);
    if (ids.length === 0) return NextResponse.json({ items: [] });

    const items = await prisma.cloudinaryImage.findMany({
        where: {
            id: { in: ids },
            userId,
            deletedAt: null,
        },
        select: { id: true, url: true, publicId: true },
    });

    return NextResponse.json({ items });
}

