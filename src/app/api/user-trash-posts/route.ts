// src/app/api/user-trash-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json(
            { error: "No logged user." },
            { status: 401 }
        );
    }

    const userId = Number(session.user.id);

    const posts = await prisma.post.findMany({
        where: {
            user_id: userId,
            deletedAt: { not: null }, // 🧺 sólo papelera
        },
        orderBy: {
            deletedAt: "desc",
        },
        include: {
            images: {
                where: { index: 0 }, // sólo imagen principal
                orderBy: { index: "asc" },
            },
        },
    });

    return NextResponse.json({ data: posts });
}

