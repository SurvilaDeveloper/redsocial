//src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import { cfg } from "./config";
import { headers } from "next/headers";
import { generateDeviceHash } from "./lib/device-fingerprint";
import { logSecurityEvent } from "./lib/security-log";
import { SecurityEventType } from "./lib/security-events";

import crypto from "crypto";
import { sendNewDeviceAlertEmail } from "./lib/email";
// import type { JWT } from "next-auth/jwt";
// import type { User, AdapterUser } from "next-auth";


export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig, // Configuración de los providers

    adapter: PrismaAdapter(prisma), // Adaptador de Prisma
    session: {
        strategy: "jwt",
        maxAge: cfg.SESSION_EXPIRE_1_DAY, // 30 dias
    },

    callbacks: {
        async signIn({ user, account }) {
            if (!user?.id) return false;

            /* ──────────────────────────────────────
             * 1️⃣ LÓGICA EXISTENTE: GOOGLE LINKING
             * ────────────────────────────────────── */
            if (account?.provider === "google") {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                });

                if (existingUser) {
                    const existingAccount = await prisma.account.findFirst({
                        where: {
                            provider: "google",
                            providerAccountId: account.providerAccountId,
                        },
                    });

                    if (!existingAccount) {
                        try {
                            await prisma.account.create({
                                data: {
                                    userId: existingUser.id,
                                    provider: "google",
                                    providerAccountId: account.providerAccountId,
                                    type: "oauth",
                                },
                            });
                        } catch (error) {
                            console.error("Error al vincular Google:", error);
                            return false;
                        }
                    }
                }
            }

            /* ──────────────────────────────────────
             * 2️⃣ DETECCIÓN DE DISPOSITIVO NUEVO
             * ────────────────────────────────────── */
            const h = await headers();

            const userAgent = h.get("user-agent") ?? "unknown";
            const acceptLanguage = h.get("accept-language") ?? "unknown";
            const ip =
                h.get("x-forwarded-for")?.split(",")[0] ??
                h.get("x-real-ip") ??
                "::1";

            // viene desde CredentialsProvider
            const timezone = (user as any).timezone ?? "unknown";

            const deviceHash = generateDeviceHash({
                userAgent
            });

            // 🔐 asegurar usuario persistido (CRÍTICO PARA OAUTH)
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email! },
            });

            if (!dbUser) {
                // Primera vez OAuth → dejar continuar
                return true;
            }

            const userId = dbUser.id;


            const revokedDevice = await prisma.trustedDevice.findFirst({
                where: {
                    userId,
                    deviceHash,
                    revokedAt: {
                        not: null,
                    },
                },
            });

            if (revokedDevice) {
                await logSecurityEvent({
                    userId,
                    type: SecurityEventType.LOGIN_BLOCKED_REVOKED_DEVICE,
                    ip,
                    userAgent,
                });

                return false; // ⛔ BLOQUEO REAL
            }


            const existingDevice = await prisma.trustedDevice.findFirst({
                where: {
                    userId,
                    deviceHash,
                    revokedAt: null,
                },
            });


            if (!existingDevice) {
                // 🆕 dispositivo nuevo
                const device = await prisma.trustedDevice.create({
                    data: {
                        userId,
                        deviceHash,
                        userAgent,
                        acceptLanguage,
                        timezone,
                        ip,
                    },
                });

                // 🔐 token para deshabilitar
                const rawToken = crypto.randomBytes(32).toString("hex");
                const tokenHash = crypto
                    .createHash("sha256")
                    .update(rawToken)
                    .digest("hex");

                const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

                await prisma.deviceDisableToken.create({
                    data: {
                        userId,
                        deviceId: device.id,
                        tokenHash,
                        expiresAt,
                    },
                });

                await logSecurityEvent({
                    userId,
                    type: SecurityEventType.LOGIN_NEW_DEVICE,
                    ip,
                    userAgent,
                    metadata: {
                        timezone,
                        acceptLanguage,
                        provider: account?.provider ?? "credentials",
                    },
                });

                // 📧 email de alerta
                await sendNewDeviceAlertEmail({
                    name: user.name ?? "Usuario",
                    email: user.email!,
                    userAgent,
                    ip,
                    timezone,
                    disableUrl: `${process.env.NEXTAUTH_URL}/security/devices/disable?token=${rawToken}`,

                });
            } else {
                // dispositivo conocido → actualizar uso
                await prisma.trustedDevice.update({
                    where: { id: existingDevice.id },
                    data: {
                        lastUsedAt: new Date(),
                        ip,
                    },
                });
            }

            return true;
        },

        async jwt({ token, user, account, trigger, session }) {
            if (account?.provider === "google") {
                token.role = "user";
            }

            // 🔁 update() desde el cliente
            if (trigger === "update" && session?.image) {
                token.imageUrl = session.image;
            }

            // 🔐 login / signup
            if (user) {
                token.id = user.id;
                token.role = (user as any).role || token.role;
                token.sessionVersion = (user as any).sessionVersion;

                token.imageUrl = (user as any).imageUrl ?? null;
                token.image = user.image ?? null; // Google
            }

            return token;
        }
        ,

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.sessionVersion = token.sessionVersion as number; // 👈

                // 👇 PRIORIDAD
                session.user.image =
                    (token.imageUrl as string | null) ??
                    (token.image as string | null) ??
                    null;
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            if (url.startsWith(baseUrl)) {
                return `${baseUrl}/`; // Redirige a la página principal
            }
            return baseUrl;
        },
    },
});

export default auth;
