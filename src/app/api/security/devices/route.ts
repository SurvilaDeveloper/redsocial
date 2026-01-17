// src/app/api/security/devices/route.ts

import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { generateDeviceHash } from "@/lib/device-fingerprint";
import { parseUserAgent } from "@/lib/security/parse-user-agent";

/**
 * GET /api/security/devices
 *
 * Propósito:
 * - Devolver los "otros dispositivos" del usuario (trusted devices),
 *   excluyendo el dispositivo actual desde el que se está haciendo la request.
 *
 * ¿Quién lo llama?
 * - UI: src/components/custom/editAccountForm.tsx (fetchDevices)
 *
 * ¿Qué significa "otros dispositivos"?
 * - Se calcula un deviceHash del request actual (principalmente user-agent).
 * - Se filtran en DB todos los trustedDevice del usuario cuyo deviceHash
 *   sea distinto al del dispositivo actual.
 *
 * Nota de seguridad/UX:
 * - Esto evita que el usuario se "revogue a sí mismo" por accidente
 *   desde la misma sesión/dispositivo.
 *
 * Output:
 * - devices: Array con datos listos para UI:
 *   { id, name, deviceType, browser, os, lastUsedAt, createdAt, revoked }
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Headers del request actual para identificar el "dispositivo actual"
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? "";

    // Hash del dispositivo actual (sirve para excluirlo del listado)
    const currentDeviceHash = generateDeviceHash({ userAgent });

    // Listamos SOLO los dispositivos del usuario que NO sean el actual
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

    // Adaptamos la respuesta para UI (nombre amigable + fechas serializadas + estado)
    const response = devices.map((device) => {
        const parsed = parseUserAgent(device.userAgent);

        return {
            id: device.id,
            name: `${parsed.browser} en ${parsed.os}`,
            deviceType: parsed.device, // desktop | mobile | tablet
            browser: parsed.browser,
            os: parsed.os,
            lastUsedAt: device.lastUsedAt.toISOString(),
            createdAt: device.createdAt.toISOString(),
            revoked: Boolean(device.revokedAt),
        };
    });

    return NextResponse.json({ devices: response });
}


