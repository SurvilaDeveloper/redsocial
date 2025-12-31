// src/app/api/security/devices/[id]/trust/route.ts

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
            revokedAt: {
                not: null,
            },
        },
    });

    if (!device) {
        return NextResponse.json(
            { error: "Device not found or already trusted" },
            { status: 404 }
        );
    }

    await prisma.trustedDevice.update({
        where: { id: deviceId },
        data: {
            revokedAt: null,
            lastUsedAt: new Date(),
        },
    });

    return NextResponse.json({ success: true });
}
