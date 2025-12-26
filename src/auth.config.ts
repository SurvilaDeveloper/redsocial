//src/auth.config.ts
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
                    const existingToken = await prisma.verificationToken.findFirst({
                        where: { identifier: user.email },
                    });

                    // Si ya existe un token, eliminarlo
                    if (existingToken?.identifier) {
                        await prisma.verificationToken.delete({
                            where: { identifier: user.email },
                        });
                    }

                    const token = nanoid();
                    await prisma.verificationToken.create({
                        data: {
                            identifier: user.email,
                            token,
                            //expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
                            expires: new Date(Date.now() + cfg.verificationEmailTokenExpires), // 10 minuto

                        },
                    });

                    // Enviar correo de verificación
                    const emailState = await sendEmailVerification(user.name, user.email, token);
                    console.log("emailState: ", emailState)
                    //throw new Error("Email send verification");
                }

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.imageUrl,
                    role: user.role || "",
                    sessionVersion: user.sessionVersion, // 🔑 CLAVE
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
