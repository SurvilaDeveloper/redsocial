import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId } = await req.json();
    if (!deviceId) {
        return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const userId = Number(session.user.id);

    const device = await prisma.trustedDevice.findFirst({
        where: {
            id: deviceId,
            userId,
            revokedAt: { not: null },
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
