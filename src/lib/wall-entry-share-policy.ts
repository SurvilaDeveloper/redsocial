// src/lib/wall-entry-share-policy.ts
import { prisma } from "@/lib/prisma";
import { getUserRelations } from "@/lib/relations";
import { RelationshipState } from "@/lib/relationship-state";

/**
 * postsWhoCanShare
 * 1 = nadie
 * 2 = amigos
 * 3 = seguidores + amigos
 * 4 = cualquier usuario logueado
 */
export async function canUserShareToWall(
    actorUserId: number,
    wallUserId: number
): Promise<boolean> {
    if (!Number.isFinite(actorUserId) || !Number.isFinite(wallUserId)) {
        return false;
    }

    if (actorUserId === wallUserId) return true;

    const target = await prisma.user.findFirst({
        where: {
            id: wallUserId,
            active: 1,
            deletedAt: null,
        },
        select: {
            configuration: {
                select: {
                    postsWhoCanShare: true,
                },
            },
        },
    });

    if (!target) return false;

    const policy = target.configuration?.postsWhoCanShare ?? 2;

    if (policy === 1) return false;
    if (policy === 4) return true;

    const rel = await getUserRelations(actorUserId, wallUserId, prisma);
    const isFriend = rel.relState === RelationshipState.FRIENDS;

    if (policy === 2) return isFriend;

    if (policy === 3) {
        // `following` significa actor -> dueño del muro.
        // Es decir: el actor es seguidor del dueño del muro.
        return isFriend || rel.following;
    }

    return false;
}
