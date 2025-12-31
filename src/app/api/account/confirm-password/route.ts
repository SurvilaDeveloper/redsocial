// src/app/api/account/confirm-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordHasBeenChangedEmail } from "@/lib/email";
import { getRequestMetadata } from "@/lib/request-metadata";
import { logSecurityEvent } from "@/lib/security-log";
import { SecurityEventType } from "@/lib/security-events";

export async function POST(req: NextRequest) {
    try {

        const { ip, userAgent } = getRequestMetadata(req);

        const { token } = await req.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Token requerido" },
                { status: 400 }
            );
        }

        // 🔹 Buscar solicitud de cambio de contraseña
        const request = await prisma.passwordChangeRequest.findUnique({
            where: { token },
        });

        if (!request) {
            return NextResponse.json(
                { error: "Token inválido" },
                { status: 404 }
            );
        }

        if (request.confirmedAt) {
            return NextResponse.json(
                { error: "Este link ya fue utilizado" },
                { status: 409 }
            );
        }

        if (request.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Este link expiró" },
                { status: 410 }
            );
        }

        // 🔹 Traer datos del usuario
        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { id: true, email: true, name: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        // 🔐 Transacción: actualizar password, invalidar requests
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    password: request.newPasswordHash,
                    sessionVersion: { increment: 1 },
                },
            }),

            prisma.passwordChangeRequest.update({
                where: { id: request.id },
                data: { confirmedAt: new Date() },
            }),

            prisma.passwordChangeRequest.updateMany({
                where: {
                    userId: user.id,
                    confirmedAt: null,
                    id: { not: request.id },
                },
                data: { confirmedAt: new Date() },
            }),
        ]);

        // 📋 Log de seguridad (no rompe la transacción)
        await logSecurityEvent({
            userId: request.userId,
            type: SecurityEventType.PASSWORD_CHANGED,
            ip,
            userAgent,
            metadata: {
                via: "email-confirmation",
            },
        });

        // ✉️ Email de notificación
        await sendPasswordHasBeenChangedEmail(user.email, user.name || "Usuario");

        return NextResponse.json({
            success: true,
            message: "Contraseña actualizada correctamente",
        });
    } catch (error) {
        console.error("CONFIRM PASSWORD ERROR:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}




