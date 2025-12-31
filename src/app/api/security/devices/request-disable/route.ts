// src/app/api/security/devices/request-disable/route.ts

import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendDisableDeviceEmail } from "@/lib/email";
import { parseUserAgent } from "@/lib/security/parse-user-agent";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId } = await req.json();
    const userId = Number(session.user.id);

    const device = await prisma.trustedDevice.findFirst({
        where: { id: deviceId, userId },
    });

    if (!device) {
        return NextResponse.json(
            { error: "Dispositivo no encontrado" },
            { status: 404 }
        );
    }

    // 🔐 Token one-time
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    await prisma.deviceDisableToken.create({
        data: {
            tokenHash,
            userId,
            deviceId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 min
        },
    });

    const parsed = parseUserAgent(device.userAgent);

    await sendDisableDeviceEmail({
        name: session.user.name ?? "Usuario",
        email: session.user.email!,
        deviceName: `${parsed.browser} en ${parsed.os}`,
        browser: parsed.browser,
        os: parsed.os,
        token: rawToken,
    });


    return NextResponse.json({ success: true });
}
