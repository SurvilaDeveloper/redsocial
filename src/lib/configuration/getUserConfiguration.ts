// src/lib/configuration/getUserConfiguration.ts
import { prisma } from "@/lib/prisma";
import type { Configuration } from "@/types/configuration";

/**
 * Obtiene la configuración de privacidad de un usuario.
 *
 * @param userId ID del usuario
 * @returns La configuración del usuario o `null` si no existe
 */
export async function getUserConfiguration(
    userId: number
): Promise<Configuration | null> {
    if (!Number.isFinite(userId)) return null;

    return prisma.configuration.findUnique({
        where: { userId },
        select: {
            // ---- Perfil ----
            profileImageVisibility: true,
            coverImageVisibility: true,
            fullProfileVisibility: true,

            // ---- Muro y contenido ----
            wallVisibility: true,
            postsVisibility: true,
            postCommentsVisibility: true,
            postRepliesVisibility: true,

            mediaVisibility: true,
            mediaCommentsVisibility: true,
            mediaRepliesVisibility: true,

            // ---- Relaciones ----
            friendsListVisibility: true,
            followersListVisibility: true,
            followingListVisibility: true,

            // ---- Interacciones ----
            likesVisibility: true,

            // ---- Compartir ----
            postsWhoCanShare: true,

            // ---- Comentarios y respuestas
            postCommentsWhoCanWrite: true,
            postRepliesWhoCanWrite: true,
            mediaCommentsWhoCanWrite: true,
            mediaRepliesWhoCanWrite: true,

        },
    });
}
