// src/app/api/security/devices/[id]/trust/route.ts

import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/security/devices/:id/trust
 *
 * Propósito:
 * - "Volver a confiar" en un dispositivo que estaba revocado.
 * - Es el complemento de la revocación (revoke/disable), pero SIN email.
 *
 * ¿Quién lo llama?
 * - UI: src/components/custom/editAccountForm.tsx (handleEnable)
 *   -> fetch(`/api/security/devices/${deviceId}/trust`, { method: "POST" })
 *
 * Reglas:
 * - Requiere usuario logueado.
 * - Solo permite operar sobre dispositivos del mismo usuario.
 * - Solo aplica si el dispositivo estaba revocado (revokedAt != null).
 *
 * Efectos:
 * - revokedAt = null (vuelve a estar "activo")
 * - lastUsedAt = now (marca actividad para UI / auditoría básica)
 */
export async function POST(_: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const deviceId = Number(params.id);

    if (!Number.isFinite(deviceId)) {
        return NextResponse.json({ error: "deviceId inválido" }, { status: 400 });
    }

    // Solo podés "confiar" dispositivos tuyos y que estén revocados
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

