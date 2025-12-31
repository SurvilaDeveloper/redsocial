// src/app/api/security/devices/disable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logSecurityEvent } from "@/lib/security-log";
import { SecurityEventType } from "@/lib/security-events";

/**
 * Lógica común para revocar un dispositivo usando token
 */
async function disableDeviceByToken(token: string, req: NextRequest) {
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const disableToken = await prisma.deviceDisableToken.findFirst({
        where: {
            tokenHash,
            expiresAt: {
                gt: new Date(),
            },
        },
        include: {
            device: true,
            user: true,
        },
    });

    if (!disableToken) {
        return { error: "Token inválido o expirado" };
    }

    const { userId, deviceId } = disableToken;

    await prisma.$transaction([
        // 📴 Revocar dispositivo
        prisma.trustedDevice.update({
            where: { id: deviceId },
            data: {
                revokedAt: new Date(),
            },
        }),

        // 🔄 Invalidar sesiones activas
        prisma.user.update({
            where: { id: userId },
            data: {
                sessionVersion: {
                    increment: 1,
                },
            },
        }),

        // 🧹 Eliminar token (one-time)
        prisma.deviceDisableToken.delete({
            where: { id: disableToken.id },
        }),
    ]);

    // 🧾 Log de seguridad
    await logSecurityEvent({
        userId,
        type: SecurityEventType.DEVICE_DISABLED,
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return { success: true };
}

/**
 * 🔗 GET → usado desde el email
 * /api/security/devices/disable?token=XXX
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/security/token-expired`
        );
    }

    const result = await disableDeviceByToken(token, req);

    if ("error" in result) {
        return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/security/token-expired`
        );
    }

    return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/security/device-disabled`
    );
}

/**
 * 📦 POST → usado desde UI / fetch
 * body: { token: string }
 */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
        return NextResponse.json(
            { error: "Token inválido" },
            { status: 400 }
        );
    }

    const result = await disableDeviceByToken(token, req);

    if ("error" in result) {
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
