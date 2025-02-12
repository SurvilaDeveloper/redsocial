import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "./lib/zod";
import { nanoid } from "nanoid";
import { sendEmailVerification } from "./lib/email";
import { cfg } from "./config";
import { redirect } from "next/dist/server/api-utils";


const authConfig: NextAuthConfig = {
    providers: [
        // Provider de credenciales
        CredentialsProvider({
            authorize: async (credentials) => {
                const { data, success } = loginSchema.safeParse(credentials);

                if (!success) {
                    throw new Error("Invalid credentials. (en auth-config.ts)");
                }

                const user = await prisma.user.findUnique({
                    where: { email: data.email },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials. (user).  (en auth-config.ts)");
                }

                const isValid = await bcrypt.compare(data.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid credentials. (password). (en auth-config.ts)");
                }

                // Verificación de email
                if (!user.emailVerified) {
                    const existingToken = await prisma.verificationtoken.findFirst({
                        where: { identifier: user.email },
                    });

                    // Si ya existe un token, eliminarlo
                    if (existingToken?.identifier) {
                        await prisma.verificationtoken.delete({
                            where: { identifier: user.email },
                        });
                    }

                    const token = nanoid();
                    await prisma.verificationtoken.create({
                        data: {
                            identifier: user.email,
                            token,
                            //expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
                            expires: new Date(Date.now() + cfg.verificationEmailTokenExpires), // 10 minuto

                        },
                    });

                    // Enviar correo de verificación
                    const emailState = await sendEmailVerification(user.email, token);
                    //console.log("emailState: ", emailState)
                    //throw new Error("Email send verification");
                }

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role || "",
                };
            },
        }),

        // Provider de Google
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            //allowDangerousEmailAccountLinking: true, // Habilita la vinculación automática
            authorization: {
                params: {
                    prompt: "consent",
                    response_type: "code",

                },
            },
        }),


    ],
    //debug: true,

    secret: process.env.AUTH_SECRET,
};

export default authConfig;

/*
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./lib/zod";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid"
import { sendEmailVerification } from "./lib/email";
import Google from "next-auth/providers/google"

export default {
    providers: [
        Credentials({
            authorize: async (credentials) => {
                const { data, success } = loginSchema.safeParse(credentials);

                if (!success) {
                    throw new Error("Invalid credentials.");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: data.email,
                    },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials. (user)");
                }

                const isValid = await bcrypt.compare(data.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid credentials. (password)");
                }
                // verificación de email
                if (!user.emailVerified) {
                    const verifyTokenExist = await prisma.verificationtoken.findFirst({
                        where: {
                            identifier: user.email
                        }
                    })
                    // si existe un token, lo eliminamos
                    if (verifyTokenExist?.identifier) {
                        await prisma.verificationtoken.delete({
                            where: {
                                identifier: user.email
                            }
                        })
                    }
                    const token = nanoid()
                    await prisma.verificationtoken.create({
                        data: {
                            identifier: user.email,
                            token,
                            expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
                        }
                    })
                    // enviar email de verificacion
                    await sendEmailVerification(user.email, token);
                    throw new Error("Email send verification")
                }
                return {
                    id: user.id.toString(),
                    name: user.username,
                    email: user.email,
                    image: user.image,
                    role: user.role || '',
                };
            },
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    //access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    secret: process.env.AUTH_SECRET
} satisfies NextAuthConfig;
*/