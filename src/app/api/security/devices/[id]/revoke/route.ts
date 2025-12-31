// src/app/api/security/devices/[id]/revoke/route.ts

import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    _: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const deviceId = Number(params.id);

    const device = await prisma.trustedDevice.findFirst({
        where: {
            id: deviceId,
            userId,
            revokedAt: null,
        },
    });

    if (!device) {
        return NextResponse.json(
            { error: "Device not found or already revoked" },
            { status: 404 }
        );
    }

    await prisma.$transaction([
        prisma.trustedDevice.update({
            where: { id: deviceId },
            data: {
                revokedAt: new Date(),
            },
        }),
        prisma.user.update({
            where: { id: userId },
            data: {
                sessionVersion: {
                    increment: 1,
                },
            },
        }),
    ]);

    return NextResponse.json({ success: true });
}
