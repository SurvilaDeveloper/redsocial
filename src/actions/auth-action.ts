/*
"use server"

import { z } from 'zod';
import { loginSchema, signUpSchema } from '@/lib/zod';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from "bcryptjs"

// función para loguear con credencials
export const loginAction = async (
    values: z.infer<typeof loginSchema>
) => {
    try {

        // verificar si existe el registro con el email
        const user = await prisma.user.findFirst({
            where: {
                email: values.email
            }
        })

        // si el campo emailVerified del registro de user es null retornar {error: ...}
        if (!user?.emailVerified) {
            return { error: "Debes verificar tu email para loguearte!!!!!" }
        }

        // llama a la función signIn() de NextAuth
        await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
        })
        return ({ success: true })
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: error.cause?.err?.message };
        }
        return { error: "error 500" }
    }
}

export const registerAction = async (
    values: z.infer<typeof signUpSchema>,
    image: string
) => {

    try {
        const { data, success } = signUpSchema.safeParse(values)
        if (!success) {
            return {
                error: "Invalid data.",
            }
        }
        const user = await prisma.user.findUnique(
            {
                where: {
                    email: data.email,
                }
            }
        )
        if (user) {
            return {
                error: "User already exists."
            }
        }
        // hash de la contraseña
        const hashedPassword = await bcrypt.hash(data.password, 10)

        // crear el usuario
        await prisma.user.create(
            {
                data: {
                    email: data.email,
                    name: data.name,
                    password: hashedPassword,
                    image: image
                }
            }
        )
        await signIn(
            "credentials",
            {
                email: data.email,
                password: data.password,
                redirect: false,
            })
        return { success: true }
    } catch (error) {

        if (error instanceof AuthError) {
            return { error: error.cause?.err?.message };
        }
        return { error: "error 500" }
    }
}

export const googleSigninAction = async () => {
    await signIn("google")
}
    */

// actions/auth-action.ts
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
    image: string
): Promise<ActionResponse> => {
    try {
        // Validar datos con safeParse (opcional si ya están tipados, pero sirve para asegurar la integridad)
        const parsed = signUpSchema.safeParse(values);
        if (!parsed.success) {
            // Se puede retornar el primer error o concatenar todos
            const validationError = parsed.error.errors.map(err => err.message).join(", ");
            return { error: `Datos inválidos: ${validationError}` };
        }
        const data = parsed.data;

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            return { error: "El usuario ya existe." };
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Crear el usuario
        await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hashedPassword,
                image,
            },
        });

        // Intentar iniciar sesión después del registro
        const signInResult = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });
        if (signInResult?.error) {
            return { error: signInResult.error };
        }

        return { success: true };
    } catch (error: unknown) {
        //console.error("Error en registerAction:", error);
        if (error instanceof AuthError) {
            return { error: error.cause?.err?.message || "Error de autenticación" };
        }
        return { error: "Error 500" };
    }
};

/** Función para iniciar sesión con Google */
export const googleSigninAction = async (): Promise<void> => {
    //try {
    await signIn("google");
    // } catch (error: any) {
    // if (error.message?.includes("NEXT_REDIRECT")) {
    //   console.log("Redirección a Google iniciada.", error);
    // Ignorar el error de redirección, ya que es parte del flujo normal.
    // return;
    //}
    //console.error("Error en googleSigninAction:", error);
    //}
}
