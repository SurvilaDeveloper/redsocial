// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
    interface Session {
        user: {
            id: string; // ✅ string, como siempre
            role: UserRole | string;
            sessionVersion: number;
            active?: number;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: UserRole | string;
        sessionVersion: number;
        active?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string; // ✅ string
        role?: UserRole | string;
        sessionVersion?: number;
        active?: number;

        imageUrl?: string | null;
        image?: string | null;
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id?: string;
        role?: UserRole | string;
        sessionVersion?: number;
        active?: number;

        imageUrl?: string | null;
        image?: string | null;
    }
}

export { };
