// src/lib/social-relations.ts
import { prisma } from "./prisma";
import { getUserRelations } from "@/lib/relations";
import { RelationshipState } from "./relationship-state";


export async function getSocialRelations(
    viewerId: number | null,
    ownerId: number,
): Promise<SocialRelations> {
    if (!viewerId) {
        return {
            following: false,
            isFollower: false,
            relState: RelationshipState.NONE,
        };
    }
    if (viewerId === ownerId) {
        return {
            following: true,
            isFollower: true,
            relState: RelationshipState.FRIENDS,
        }
    }
    return getUserRelations(viewerId, ownerId, prisma);
}
