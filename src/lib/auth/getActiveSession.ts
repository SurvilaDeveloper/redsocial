// src/lib/auth/getActiveSession.ts

/* ========= No usada, reemplazada por getValidatedSession ==========*/

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Devuelve la sesión SOLO si el usuario está activo.
 * Si está desactivado, borrado o no hay sesión → null.
 */
export async function getActiveSession(): Promise<Session | null> {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    const userId = Number(session.user.id);

    if (Number.isNaN(userId)) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            active: true,
            deletedAt: true,
        },
    });

    if (!user) return null;
    if ((user.active ?? 1) !== 1) return null;
    if (user.deletedAt) return null;

    return session;
}
