// src/lib/social-relations.ts

import { PrismaClient } from "@prisma/client";
import { getUserRelations } from "@/lib/relations";
import { RelationshipState } from "@/lib/relationship-state";

export async function getSocialRelations(
    viewerId: number | null,
    ownerId: number,
    prisma: PrismaClient
): Promise<SocialRelations> {
    if (!viewerId || viewerId === ownerId) {
        return {
            following: false,
            isFollower: false,
            relState: RelationshipState.NONE,
        };
    }

    return getUserRelations(viewerId, ownerId, prisma);
}
