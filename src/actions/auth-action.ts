// src/actions/auth-action.ts
"use server";

import { z } from "zod";
import { loginSchema, signUpSchema } from "@/lib/zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type ActionResponse = {
    success?: true;
    error?: string;
    email?: string;
};

const SALT_ROUNDS = 10;

/** Función para loguear con credenciales (solo valida) */
export const loginAction = async (
    values: z.infer<typeof loginSchema>
): Promise<ActionResponse> => {
    try {
        // Validar con Zod por las dudas
        const parsed = loginSchema.safeParse(values);
        if (!parsed.success) {
            const validationError = parsed.error.errors
                .map((err) => err.message)
                .join(", ");
            return { error: `Datos inválidos: ${validationError}` };
        }

        const data = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            return { error: "Usuario no encontrado. (en loginAction)" };
        }

        if (!user.emailVerified) {
            return {
                error: "Debes verificar tu email para loguearte. (en loginAction)",
                email: user.email,
            };
        }

        if (!user.password) {
            return { error: "El usuario no tiene contraseña almacenada." };
        }

        const isValid = await bcrypt.compare(data.password, user.password);
        if (!isValid) {
            return { error: "Contraseña incorrecta." };
        }

        // 👇 IMPORTANTE:
        // Aquí NO llamamos a signIn. Solo confirmamos que las credenciales son válidas.
        // En el cliente, luego de recibir success: true,
        // vas a llamar a signIn("credentials", { email, password, ... }).

        return { success: true, email: user.email };
    } catch (error: unknown) {
        console.error("Error en loginAction:", error);
        return { error: "Error 500 en loginAction." };
    }
};

/** Función para registrar un usuario (solo crea el user) */
export const registerAction = async (
    values: z.infer<typeof signUpSchema>,
    image?: { url: string; publicId: string } | null
): Promise<ActionResponse> => {
    try {
        const parsed = signUpSchema.safeParse(values);
        if (!parsed.success) {
            const validationError = parsed.error.errors
                .map((err) => err.message)
                .join(", ");
            return { error: `Datos inválidos: ${validationError}` };
        }

        const data = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return { error: "El usuario ya existe." };
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hashedPassword,
                imageUrl: image?.url ?? null,
                imagePublicId: image?.publicId ?? null,
                // Si querés que entre ya verificado, podrías hacer:
                // emailVerified: new Date(),
            },
        });

        // Igual que en loginAction:
        // NO hacemos signIn acá. Solo devolvemos success.
        // En el cliente, después de registrar, podés:
        // - o redirigir al login,
        // - o hacer signIn("credentials", { email, password, ... }).

        return { success: true, email: data.email };
    } catch (error: unknown) {
        console.error("Error en registerAction:", error);
        return { error: "Error 500 en registerAction." };
    }
};

/** Función para iniciar sesión con Google */
export const googleSigninAction = async (): Promise<void> => {
    // Esto sí puede seguir igual: delega el flujo a Auth.js
    await signIn("google");
};

