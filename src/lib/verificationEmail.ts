// src/lib/verificationEmail.ts
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { sendEmailVerification } from "@/lib/email";
import { cfg } from "@/config";

export async function issueVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return { ok: false as const, error: "El usuario no existe" };
    }

    if (user.emailVerified) {
        return { ok: false as const, error: "El email ya fue verificado" };
    }

    // si ya existe un token, borrarlo (mismo comportamiento que tu endpoint)
    const existingToken = await prisma.verificationToken.findFirst({
        where: { identifier: email },
    });

    if (existingToken) {
        await prisma.verificationToken.delete({
            where: { identifier: email },
        });
    }

    // crear token
    const token = nanoid();

    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires: new Date(Date.now() + cfg.verificationEmailTokenExpires),
        },
    });

    const emailState = await sendEmailVerification(user.name, email, token);

    return { ok: true as const, emailState };
}
