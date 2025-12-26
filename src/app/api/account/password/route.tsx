// src/app/api/account/password/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/zod";
import { sendPasswordChangeEmail } from "@/lib/email";

export async function PUT(req: NextRequest) {
    try {
        // 1️⃣ Sesión
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const userId = Number(session.user.id);

        // 2️⃣ Body
        const body = await req.json();

        // 3️⃣ Validación Zod
        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};

            parsed.error.issues.forEach((issue) => {
                const field = issue.path[0] as string;
                fieldErrors[field] = issue.message;
            });

            return NextResponse.json(
                { errors: fieldErrors },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = parsed.data;

        // 4️⃣ Usuario actual
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
                email: true,
            },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: "Usuario inválido" },
                { status: 404 }
            );
        }

        // 5️⃣ Verificar password actual
        const isValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isValid) {
            return NextResponse.json(
                {
                    errors: {
                        currentPassword: "La contraseña actual es incorrecta",
                    },
                },
                { status: 400 }
            );
        }

        // 🔐 6️⃣ Generar token seguro
        const token = crypto.randomBytes(32).toString("hex");

        // ⏰ expira en 1 hora
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        // 🔑 hash de la nueva password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 🗄️ 7️⃣ Guardar solicitud de cambio
        await prisma.passwordChangeRequest.create({
            data: {
                userId,
                token,
                newPasswordHash,
                expiresAt,
            },
        });
        await sendPasswordChangeEmail({
            email: user.email,
            token,
        });

        // 8️⃣ Respuesta (el mail viene en el próximo paso)
        return NextResponse.json({
            success: true,
            message: "Se envió un email para confirmar el cambio de contraseña",
        });
    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}


