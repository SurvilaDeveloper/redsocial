// src/app/api/account/confirm-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordHasBeenChangedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Token requerido" },
                { status: 400 }
            );
        }

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
        // traer datos del usuario
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


        await prisma.$transaction([
            // 🔐 actualizar password + invalidar sesiones
            prisma.user.update({
                where: { id: request.userId },
                data: {
                    password: request.newPasswordHash,
                    sessionVersion: { increment: 1 }, // 🔥 CLAVE
                },
            }),

            // marcar request actual
            prisma.passwordChangeRequest.update({
                where: { id: request.id },
                data: { confirmedAt: new Date() },
            }),

            // invalidar otros requests
            prisma.passwordChangeRequest.updateMany({
                where: {
                    userId: request.userId,
                    confirmedAt: null,
                    id: { not: request.id },
                },
                data: { confirmedAt: new Date() },
            }),

            // 📋 Security log
            prisma.securityLog.create({
                data: {
                    userId: request.userId,
                    type: "PASSWORD_CHANGED",
                    metadata: { via: "email-confirmation" },
                },
            }),


        ]);
        // después de actualizar la contraseña y marcar el request como confirmado
        await sendPasswordHasBeenChangedEmail(
            user.email,
            user.name || "Usuario"
        );


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



