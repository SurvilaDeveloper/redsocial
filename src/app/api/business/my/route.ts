// src/app/api/business/my/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businesses = await prisma.business.findMany({
        where: {
            ownerId: userId,
            deletedAt: null,
            active: 1,
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
        },
    });

    return NextResponse.json({ businesses });
}
