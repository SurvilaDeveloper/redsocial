// src/lib/auth/register-user.ts
import { z } from "zod";
import bcrypt from "bcryptjs";

import { signUpSchema } from "@/lib/zod";
import { prisma } from "@/lib/prisma";
import { issueVerificationEmail } from "@/lib/verificationEmail";

const SALT_ROUNDS = 10;

export type RegistrationImage = {
    url: string;
    publicId: string;
};

export type RegisterUserResult =
    | {
        success: true;
        email: string;
        userId: number;
    }
    | {
        success: false;
        code: "INVALID_DATA" | "USER_EXISTS" | "INTERNAL_ERROR";
        error: string;
    };

export async function registerUser(
    values: z.infer<typeof signUpSchema>,
    image: RegistrationImage | null = null
): Promise<RegisterUserResult> {
    const parsed = signUpSchema.safeParse(values);

    if (!parsed.success) {
        const validationError = parsed.error.errors
            .map((err) => err.message)
            .join(", ");

        return {
            success: false,
            code: "INVALID_DATA",
            error: `Datos inválidos: ${validationError}`,
        };
    }

    const data = parsed.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true },
        });

        if (existingUser) {
            return {
                success: false,
                code: "USER_EXISTS",
                error: "El usuario ya existe.",
            };
        }

        const hashedPassword = await bcrypt.hash(
            data.password,
            SALT_ROUNDS
        );

        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    password: hashedPassword,
                    imageUrl: image?.url ?? null,
                    imagePublicId: image?.publicId ?? null,
                    emailVerified: null,
                },
                select: {
                    id: true,
                    email: true,
                },
            });

            await tx.configuration.create({
                data: {
                    userId: createdUser.id,
                },
            });

            if (image) {
                await tx.cloudinaryImage.create({
                    data: {
                        userId: createdUser.id,
                        url: image.url,
                        publicId: image.publicId,
                    },
                });
            }

            return createdUser;
        });

        try {
            const issued = await issueVerificationEmail(data.email);

            if (!issued.ok) {
                console.warn(
                    "[registerUser] No se pudo emitir verificación:",
                    issued.error
                );
            }
        } catch (mailError) {
            // La cuenta ya fue creada correctamente. Un fallo de correo no debe
            // transformar el registro en error ni provocar rollback de Cloudinary.
            console.warn(
                "[registerUser] Error enviando verificación:",
                mailError
            );
        }

        return {
            success: true,
            email: user.email,
            userId: user.id,
        };
    } catch (error: any) {
        if (error?.code === "P2002") {
            return {
                success: false,
                code: "USER_EXISTS",
                error: "El usuario ya existe.",
            };
        }

        console.error("Error en registerUser:", error);

        return {
            success: false,
            code: "INTERNAL_ERROR",
            error: "Error 500 en registerAction.",
        };
    }
}
