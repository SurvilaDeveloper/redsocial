// src/lib/auth/getValidatedSession.ts
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export type ActiveSessionResult =
    | { status: "ok"; session: Session }
    | { status: "logged_out"; session: null }
    | { status: "forced_logout"; session: null };

/**
 * Valida la sesión actual contra el estado real del usuario en la base de datos.
 *
 * Esta función:
 * - Verifica que exista una sesión válida.
 * - Comprueba que el usuario esté activo y no eliminado.
 * - Detecta si la sesión fue invalidada por un administrador comparando `sessionVersion`.
 *
 * @returns
 * - `{ status: "ok", session }` si la sesión es válida y coincide con el estado actual del usuario.
 * - `{ status: "forced_logout", session: null }` si la sesión existe pero fue invalidada (sessionVersion no coincide).
 * - `{ status: "logged_out", session: null }` si no hay sesión, el usuario está inactivo o fue eliminado.
 */
export async function getValidatedSession(): Promise<ActiveSessionResult> {
    const session = await auth();

    if (!session?.user?.id) {
        return { status: "logged_out", session: null };
    }

    const userId = Number(session.user.id);
    if (Number.isNaN(userId)) {
        return { status: "logged_out", session: null };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            active: true,
            deletedAt: true,
            sessionVersion: true,
        },
    });

    if (!user) return { status: "logged_out", session: null };
    if ((user.active ?? 1) !== 1) return { status: "logged_out", session: null };
    if (user.deletedAt) return { status: "logged_out", session: null };

    // 🔴 CLAVE: sesión invalidada por admin
    if (
        typeof session.user.sessionVersion === "number" &&
        session.user.sessionVersion !== user.sessionVersion
    ) {
        return { status: "forced_logout", session: null };
    }

    return { status: "ok", session };
}
