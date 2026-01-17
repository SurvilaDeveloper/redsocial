// src/app/api/security/devices/disable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logSecurityEvent } from "@/lib/security-log";
import { SecurityEventType } from "@/lib/security-events";

/**
 * Revocar un dispositivo CONFIRMADO por token (one-time).
 *
 * ¿De dónde sale este token?
 * - Se genera en: POST /api/security/devices/request-disable
 * - Se envía por email en un link a: /security/devices/disable?token=...
 *
 * ¿Quién llama a esta función?
 * - POST /api/security/devices/disable (este mismo archivo) con body: { token }
 *   -> Ese POST lo dispara la UI: src/app/security/devices/disable/page.tsx
 *
 * Efectos secundarios importantes:
 * - Marca el dispositivo como revocado (revokedAt = now)
 * - Invalida sesiones activas incrementando user.sessionVersion
 * - Borra el token (one-time) para evitar re-uso
 * - Registra evento de seguridad (DEVICE_DISABLED)
 */
async function disableDeviceByToken(token: string, req: NextRequest) {
    // Guardamos solo el hash para que si alguien roba la DB no pueda usar tokens crudos.
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Buscamos un token válido y no expirado
    const disableToken = await prisma.deviceDisableToken.findFirst({
        where: {
            tokenHash,
            expiresAt: { gt: new Date() },
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
            data: { revokedAt: new Date() },
        }),

        // 🔄 Invalidar sesiones activas (logout global)
        prisma.user.update({
            where: { id: userId },
            data: { sessionVersion: { increment: 1 } },
        }),

        // 🧹 Token de un solo uso
        prisma.deviceDisableToken.delete({
            where: { id: disableToken.id },
        }),
    ]);

    // 🧾 Auditoría / Log de seguridad
    await logSecurityEvent({
        userId,
        type: SecurityEventType.DEVICE_DISABLED,
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return { success: true };
}

/**
 * POST /api/security/devices/disable
 *
 * Uso:
 * - Confirmación desde UI (no desde editAccount directo):
 *   La page /security/devices/disable lee el token de la URL (?token=...)
 *   y hace POST a este endpoint con body: { token: string }.
 *
 * Importante:
 * - Este endpoint NO acepta deviceId.
 * - El deviceId se resuelve indirectamente a partir del token guardado en DB.
 */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== "string") {
        return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const result = await disableDeviceByToken(token, req);

    if ("error" in result) {
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true });
}

