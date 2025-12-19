//src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import { cfg } from "./config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig, // Configuración de los providers

    adapter: PrismaAdapter(prisma), // Adaptador de Prisma
    session: {
        strategy: "jwt",
        maxAge: cfg.SESSION_EXPIRE_1_DAY, // 30 dias
    },

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                });

                if (existingUser) {

                    console.log("Usuario encontrado en callbacks: ", existingUser);
                    // Verificar si la cuenta de Google ya está vinculada
                    const existingAccount = await prisma.account.findFirst({
                        where: { provider: "google", providerAccountId: account.providerAccountId },
                    });

                    if (!existingAccount) {
                        console.log("El usuario existe y no tiene cuenta vinculada: ");
                        try {
                            // Vincula la cuenta de Google
                            await prisma.account.create({
                                data: {
                                    userId: existingUser.id,
                                    provider: "google",
                                    providerAccountId: account.providerAccountId,
                                    type: "oauth",
                                },
                            });
                            console.log("Cuenta vinculada exitosamente.");
                        } catch (error) {
                            console.error("Error al vincular la cuenta de Google:", error);
                            return false; // Impide el inicio de sesión si hay un error
                        }
                    }
                } else {
                    console.log("Usuario no encontrado.");
                }
                return true; // Permite el acceso
            }
            return true; // Permitir el acceso
        },

        async jwt({ token, user, account }) {
            if (account?.provider === "google") {
                token.role = "user"; // Define un rol predeterminado
            }
            if (user) {
                token.id = user.id;
                token.role = user.role || token.role; // Si es credencial, toma el rol
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string; // Propaga el ID
                session.user.role = token.role as string; // Propaga el rol
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
