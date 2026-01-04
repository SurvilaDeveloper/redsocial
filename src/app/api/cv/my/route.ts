// src/app/api/cv/my/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cvs = await prisma.curriculum.findMany({
        where: { userId: Number(session.user.id) },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            title: true,
            summary: true,
            isPublic: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({ cvs });
}
