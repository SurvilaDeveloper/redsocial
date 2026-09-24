// src/app/api/media/register/route.ts
import { NextRequest, NextResponse } from "next/server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    const userId =
        session?.user?.id != null
            ? Number(session.user.id)
            : null;

    if (!userId || !Number.isFinite(userId)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await req.json().catch(() => null);

    const url = String(body?.url ?? "").trim();
    const publicId = String(body?.publicId ?? "").trim();

    if (!url || !publicId) {
        return NextResponse.json(
            { error: "Missing url/publicId" },
            { status: 400 }
        );
    }

    const existing =
        await prisma.cloudinaryImage.findUnique({
            where: { publicId },
            select: {
                id: true,
                userId: true,
                url: true,
                publicId: true,
                createdAt: true,
            },
        });

    if (existing) {
        // Nunca transferimos ownership por conocer un publicId.
        if (existing.userId !== userId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Tampoco permitimos cambiar la URL canónica del mismo asset.
        if (existing.url !== url) {
            return NextResponse.json(
                {
                    error: "publicId/url mismatch",
                },
                { status: 409 }
            );
        }

        const row =
            await prisma.cloudinaryImage.update({
                where: { publicId },
                data: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                    url: true,
                    publicId: true,
                    createdAt: true,
                },
            });

        return NextResponse.json({ item: row });
    }

    const row = await prisma.cloudinaryImage.create({
        data: {
            url,
            publicId,
            userId,
        },
        select: {
            id: true,
            url: true,
            publicId: true,
            createdAt: true,
        },
    });

    return NextResponse.json(
        { item: row },
        { status: 201 }
    );
}
