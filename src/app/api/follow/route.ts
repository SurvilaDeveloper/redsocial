//src/app/api/follow/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { followingId } = await req.json();
    const followerId = parseInt(session.user.id);

    if (!followingId) {

        return NextResponse.json({ error: "Missing followingId" }, { status: 400 });
    }

    try {
        const existingFollow = await prisma.follow.findFirst({
            where: { followerId, followingId }
        });

        if (existingFollow) {
            // Si ya sigue al usuario, lo deja de seguir
            await prisma.follow.delete({
                where: { id: existingFollow.id }
            });
            return NextResponse.json({ following: false });
        } else {
            // Si no lo sigue, crea la relación
            await prisma.follow.create({
                data: { followerId, followingId }
            });
            return NextResponse.json({ following: true });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
