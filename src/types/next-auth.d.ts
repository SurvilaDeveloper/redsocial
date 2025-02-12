import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface User {
        role: string; // Incluye el rol en el objeto User
    }

    interface Session {
        user: {
            id: string; // Asegúrate de incluir `id` si lo estás pasando
            role: string; // Incluye `role` en la sesión del usuario
        } & DefaultSession["user"];
    }

    interface JWT {
        role: string; // Añade el rol al token JWT
    }
}
