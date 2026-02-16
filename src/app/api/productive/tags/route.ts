// src/app/api/productive/tags/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { recomputeProductiveProfileTx } from "@/lib/productive/recompute-productive-profile";
import { normalizeKeyword } from "@/lib/productive/normalize";

type StoredTag = { k: "tag"; t: string; o: string };

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number(session.user.id);

    const row = await prisma.userProductiveKeywords.findUnique({
        where: { userId_source: { userId, source: "profile" } },
        select: { keywords: true },
    });

    const arr = Array.isArray(row?.keywords) ? (row!.keywords as any[]) : [];
    const tags = arr.filter((x) => x && typeof x === "object" && x.k === "tag" && typeof x.t === "string" && typeof x.o === "string") as StoredTag[];


    return NextResponse.json({ tags });
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number(session.user.id);

    const body = await req.json().catch(() => null);
    const incoming = Array.isArray(body?.tags) ? body.tags : [];

    const cleaned = incoming
        .map((s: any) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .slice(0, 80);

    // normalizar + dedupe por t
    const map = new Map<string, StoredTag>();
    for (const o of cleaned) {
        const t = normalizeKeyword(o);
        if (!t) continue;
        map.set(t, { k: "tag", t, o }); // ✅ o original
    }
    const nextTags = Array.from(map.values());

    const updated = await prisma.$transaction(async (tx) => {
        // leer existentes profile (para merge)
        const existing = await tx.userProductiveKeywords.findUnique({
            where: { userId_source: { userId, source: "profile" } },
            select: { keywords: true },
        });

        const prevArr = Array.isArray(existing?.keywords) ? (existing!.keywords as any[]) : [];
        const preserved = prevArr.filter((x) => !(x && typeof x === "object" && x.k === "tag"));

        const merged = [...preserved, ...nextTags];

        await tx.userProductiveKeywords.upsert({
            where: { userId_source: { userId, source: "profile" } },
            create: { userId, source: "profile", keywords: merged as unknown as Prisma.InputJsonValue, version: 1 },
            update: { keywords: merged as unknown as Prisma.InputJsonValue, version: 1 },
        });

        // ✅ recompute profile (ahora incluye tags con peso fuerte)
        await recomputeProductiveProfileTx(tx, userId);

        return nextTags;
    });

    return NextResponse.json({ ok: true, tags: updated });
}
