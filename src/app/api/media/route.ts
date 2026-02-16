//src/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") ?? "").trim();
    const take = Math.min(60, Math.max(1, Number(searchParams.get("take") ?? 36)));

    const items = await prisma.cloudinaryImage.findMany({
        where: {
            userId,
            deletedAt: null,
            ...(q
                ? {
                    OR: [
                        { publicId: { contains: q } },
                        { url: { contains: q } },
                    ],
                }
                : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
    });

    return NextResponse.json({ items });
}
