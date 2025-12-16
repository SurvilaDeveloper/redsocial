
"use server";

import { z } from "zod";
import { loginSchema, signUpSchema } from "@/lib/zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Definición del tipo de respuesta de las acciones
type ActionResponse = {
    success?: true
    error?: string,
    email?: string
};

// Constante para bcrypt
const SALT_ROUNDS = 10;

/** Función para loguear con credenciales */
export const loginAction = async (
    values: z.infer<typeof loginSchema>
): Promise<ActionResponse> => {
    try {
        // Buscar usuario por email (suponiendo que email es único)
        const user = await prisma.user.findUnique({
            where: { email: values.email },
        });

        // Si no se encontró el usuario o no se verificó el email, se retorna error.

        if (!user) {
            return { error: "Usuario no encontrado. (en loginAction)" };
        }
        if (!user.emailVerified) {
            return {
                error: "Debes verificar tu email para loguearte. (en loginAction)",
                email: user.email,
            };
        }

        // Se llama a signIn y se captura el resultado (si lo proporciona NextAuth)
        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
        });

        // Si result indica error, se podría manejar aquí:
        if (result?.error) {
            return { error: result.error };
        }

        return { success: true };
    } catch (error: unknown) {
        if (error instanceof AuthError) { // Si es un error de autenticación, se captura el mensaje de error en la configuración del CredencialProvider en auth.config.ts.
            return { error: error.cause?.err?.message || "Error de autenticación" };
        }
        return { error: "Error 500" };
    }
};

/** Función para registrar un usuario */
export const registerAction = async (
    values: z.infer<typeof signUpSchema>,
    image?: { url: string; publicId: string } | null
): Promise<ActionResponse> => {
    try {
        const parsed = signUpSchema.safeParse(values);
        if (!parsed.success) {
            const validationError = parsed.error.errors.map(err => err.message).join(", ");
            return { error: `Datos inválidos: ${validationError}` };
        }
        const data = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) return { error: "El usuario ya existe." };

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hashedPassword,
                imageUrl: image?.url ?? null,
                imagePublicId: image?.publicId ?? null,
            },
        });

        const signInResult = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        if (signInResult?.error) return { error: signInResult.error };

        return { success: true };
    } catch (error: any) {
        console.error("Error en registerAction:", error); // 👈 dejalo para ver el error real
        if (error instanceof AuthError) {
            return { error: error.cause?.err?.message || "Error de autenticación" };
        }
        return { error: error?.message ?? "Error 500" };
    }
};


/** Función para iniciar sesión con Google */
export const googleSigninAction = async (): Promise<void> => {
    await signIn("google");

}
