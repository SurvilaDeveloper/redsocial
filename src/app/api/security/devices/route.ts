// src/app/api/security/devices/route.ts

import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { generateDeviceHash } from "@/lib/device-fingerprint";
import { parseUserAgent } from "@/lib/security/parse-user-agent";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    const headersList = await headers();

    const userAgent = headersList.get("user-agent") ?? "";
    //const acceptLanguage = headersList.get("accept-language") ?? "";
    //const timezone = headersList.get("x-timezone") ?? "UTC";

    const currentDeviceHash = generateDeviceHash({
        userAgent
    });

    console.log('currentDeviceHash en src/app/api/security/devices/route.ts:', currentDeviceHash);

    const devices = await prisma.trustedDevice.findMany({
        where: {
            userId,
            deviceHash: {
                not: currentDeviceHash,
            },
        },
        orderBy: {
            lastUsedAt: "desc",
        },
    });

    const response = devices.map((device) => {
        const parsed = parseUserAgent(device.userAgent);

        return {
            id: device.id,
            name: `${parsed.browser} en ${parsed.os}`,
            deviceType: parsed.device, // 👈 desktop | mobile | tablet
            browser: parsed.browser,
            os: parsed.os,
            lastUsedAt: device.lastUsedAt.toISOString(),
            createdAt: device.createdAt.toISOString(),
            revoked: Boolean(device.revokedAt),
        };
    });

    return NextResponse.json({ devices: response });
}

