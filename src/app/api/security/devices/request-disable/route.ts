// src/app/api/security/devices/request-disable/route.ts

import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendDisableDeviceEmail } from "@/lib/email";
import { parseUserAgent } from "@/lib/security/parse-user-agent";

/**
 * POST /api/security/devices/request-disable
 *
 * Propósito:
 * - Iniciar el proceso de revocación de un dispositivo.
 * - ⚠️ NO revoca el dispositivo directamente.
 *
 * Flujo completo:
 * 1) UI (editAccountForm) llama a este endpoint con { deviceId }.
 * 2) Se valida que el dispositivo pertenezca al usuario logueado.
 * 3) Se genera un token de un solo uso (one-time, 15 min).
 * 4) Se guarda el hash del token en DB (nunca el token crudo).
 * 5) Se envía un email con link de confirmación.
 * 6) El usuario confirma desde:
 *    /security/devices/disable?token=...
 *
 * ¿Quién lo llama?
 * - src/components/custom/editAccountForm.tsx (handleDisable)
 *
 * Seguridad:
 * - Requiere sesión válida.
 * - El deviceId debe pertenecer al usuario.
 * - El token expira y solo puede usarse una vez.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Body esperado: { deviceId: number }
    const body = await req.json().catch(() => null);
    const deviceId = Number(body?.deviceId);
    const userId = Number(session.user.id);

    if (!Number.isFinite(deviceId)) {
        return NextResponse.json(
            { error: "deviceId inválido" },
            { status: 400 }
        );
    }

    // Validamos que el dispositivo pertenezca al usuario
    const device = await prisma.trustedDevice.findFirst({
        where: { id: deviceId, userId },
    });

    if (!device) {
        return NextResponse.json(
            { error: "Dispositivo no encontrado" },
            { status: 404 }
        );
    }

    // 🔐 Token de un solo uso (confirmación por email)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.deviceDisableToken.create({
        data: {
            tokenHash,
            userId,
            deviceId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutos
        },
    });

    // Información del dispositivo para mostrar en el email
    const parsed = parseUserAgent(device.userAgent);

    // 📧 Email de confirmación
    await sendDisableDeviceEmail({
        name: session.user.name ?? "Usuario",
        email: session.user.email!, // Ojo: actualmente el envío puede estar provisorio
        deviceName: `${parsed.browser} en ${parsed.os}`,
        browser: parsed.browser,
        os: parsed.os,
        token: rawToken, // Se envía SOLO por email, nunca se guarda crudo
    });

    return NextResponse.json({ success: true });
}

