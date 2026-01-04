// src/actions/auth-action.ts
"use server";

import { z } from "zod";
import { loginSchema, signUpSchema } from "@/lib/zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { issueVerificationEmail } from "@/lib/verificationEmail";

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
            const validationError = parsed.error.errors.map((err) => err.message).join(", ");
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

        const user = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    password: hashedPassword,
                    imageUrl: image?.url ?? null,
                    imagePublicId: image?.publicId ?? null,
                    emailVerified: null,
                },
            });
            // 👇 crear configuración por defecto
            await tx.configuration.create({
                data: {
                    userId: user.id,
                    // no hace falta pasar nada más: usa defaults del schema
                },
            });

            if (image) {
                await tx.cloudinaryImage.create({
                    data: {
                        userId: user.id,
                        url: image.url,
                        publicId: image.publicId,
                    },
                });
            }

            return user;
        });


        // ✅ mandar mail de verificación automáticamente al registrarse
        const issued = await issueVerificationEmail(data.email);
        if (!issued.ok) {
            // Usuario creado pero no se pudo mandar mail (no rompas el registro)
            console.warn("[registerAction] No se pudo emitir verificación:", issued.error);
        }

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

