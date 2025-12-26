// src/types/next-auth.d.ts

import { DefaultSession } from "next-auth";

/* ===========================
   NextAuth main module
   =========================== */
declare module "next-auth" {
    interface User {
        id: string;
        role: string;
        sessionVersion: number;
    }

    interface Session {
        user: {
            id: string;
            role: string;
            sessionVersion: number;
        } & DefaultSession["user"];
    }
}

/* ===========================
   JWT module
   =========================== */
declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: string;
        sessionVersion?: number;
    }
}

