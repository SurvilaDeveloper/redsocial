// src/actions/auth-action.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { loginSchema, signUpSchema } from "@/lib/zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerUser } from "@/lib/auth/register-user";
import { getRateLimitClientIp } from "@/lib/rate-limit-client-ip";
import {
    registrationEmailRules,
    registrationIpRules,
    verificationEmailRules,
    verificationIpRules,
} from "@/lib/rate-limit-policies";
import { consumeRateLimits } from "@/lib/rate-limit";

type ActionResponse = {
    success?: true;
    error?: string;
    email?: string;
    code?: "RATE_LIMITED" | "RATE_LIMIT_UNAVAILABLE";
    retryAfterSec?: number;
};

/** Función para loguear con credenciales (solo valida) */
export const loginAction = async (
    values: z.infer<typeof loginSchema>
): Promise<ActionResponse> => {
    try {
        const parsed = loginSchema.safeParse(values);

        if (!parsed.success) {
            const validationError = parsed.error.errors
                .map((err) => err.message)
                .join(", ");

            return {
                error: `Datos inválidos: ${validationError}`,
            };
        }

        const data = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            return {
                error: "Usuario no encontrado. (en loginAction)",
            };
        }

        if (!user.emailVerified) {
            return {
                error: "Debes verificar tu email para loguearte. (en loginAction)",
                email: user.email,
            };
        }

        if (!user.password) {
            return {
                error: "El usuario no tiene contraseña almacenada.",
            };
        }

        const isValid = await bcrypt.compare(
            data.password,
            user.password
        );

        if (!isValid) {
            return { error: "Contraseña incorrecta." };
        }

        return {
            success: true,
            email: user.email,
        };
    } catch (error: unknown) {
        console.error("Error en loginAction:", error);

        return {
            error: "Error 500 en loginAction.",
        };
    }
};

/**
 * Compatibilidad para cualquier caller server-action que siga existiendo.
 *
 * La acción conserva el segundo argumento por compatibilidad, pero lo ignora.
 * Una imagen del alta solo puede entrar por POST /api/register, donde el archivo
 * es validado y subido del lado servidor.
 */
export const registerAction = async (
    values: z.infer<typeof signUpSchema>,
    _image?: { url: string; publicId: string } | null
): Promise<ActionResponse> => {
    try {
        const requestHeaders = await headers();
        const ip = getRateLimitClientIp(requestHeaders);
        const email = String(values?.email ?? "");
        const decision = await consumeRateLimits([
            ...registrationIpRules(ip),
            ...registrationEmailRules(email),
            ...verificationIpRules(ip),
            ...verificationEmailRules(email),
        ]);

        if (!decision.ok) {
            return {
                error: "Demasiadas solicitudes. Intenta nuevamente mas tarde.",
                code: "RATE_LIMITED",
                retryAfterSec: decision.retryAfterSec,
            };
        }
    } catch (error) {
        console.error("registerAction rate limit error:", error);
        return {
            error: "El control de solicitudes no esta disponible temporalmente.",
            code: "RATE_LIMIT_UNAVAILABLE",
        };
    }

    const result = await registerUser(values, null);

    if (!result.success) {
        return { error: result.error };
    }

    return {
        success: true,
        email: result.email,
    };
};

/** Función para iniciar sesión con Google */
export const googleSigninAction = async (): Promise<void> => {
    await signIn("google");
};
