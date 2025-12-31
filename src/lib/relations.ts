// lib/relations.ts
import { getRelationshipState } from "@/lib/relationship";

export async function getUserRelations(
    viewerId: number,
    targetUserId: number,
    prisma: any
): Promise<SocialRelations> {
    const [following, follower, relState] = await Promise.all([
        prisma.follow.findFirst({
            where: {
                followerId: viewerId,
                followingId: targetUserId,
            },
            select: { id: true },
        }),
        prisma.follow.findFirst({
            where: {
                followerId: targetUserId,
                followingId: viewerId,
            },
            select: { id: true },
        }),
        getRelationshipState(viewerId, targetUserId),
    ]);

    return {
        following: !!following,
        isFollower: !!follower,
        relState,
    };
}

