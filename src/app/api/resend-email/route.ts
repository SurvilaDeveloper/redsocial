// app/api/resend-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { sendEmailVerification } from "@/lib/email";
import { cfg } from "@/config";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // Buscar el usuario por email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.emailVerified) {
            return NextResponse.json({ error: "El email ya fue verificado o no existe" }, { status: 400 });
        }

        // Si ya existe un token, eliminarlo
        const existingToken = await prisma.verificationtoken.findFirst({
            where: { identifier: email },
        });

        if (existingToken) {
            await prisma.verificationtoken.delete({
                where: { identifier: email },
            });
        }

        // Crear un nuevo token
        const token = nanoid();
        await prisma.verificationtoken.create({
            data: {
                identifier: email,
                token,
                expires: new Date(Date.now() + cfg.verificationEmailTokenExpires), // 10 minutos
            },
        });

        // Enviar el correo de verificación
        const emailState = await sendEmailVerification(user.name, email, token);

        return NextResponse.json({ success: true, emailState });
    } catch (error) {
        //console.error("Error en API resend-email:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
