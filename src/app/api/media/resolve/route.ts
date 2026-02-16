//src/api/media/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];

    if (ids.length === 0) return NextResponse.json({ map: {} });

    const rows = await prisma.cloudinaryImage.findMany({
        where: { userId, deletedAt: null, id: { in: ids } },
        select: { id: true, url: true },
    });

    const map: Record<number, string> = {};
    for (const r of rows) map[r.id] = r.url;

    return NextResponse.json({ map });
}
