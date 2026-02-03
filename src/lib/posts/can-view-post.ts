// src/lib/posts/can-view-post.ts
import type { PrismaClient } from "@prisma/client";
import { canViewPost } from "@/lib/post-visibility";
import { getUserRelations } from "@/lib/relations";
import { RelationshipState } from "@/lib/relationship-state";

export async function canViewerSeePost(
    prisma: PrismaClient,
    viewerId: number,
    post: { authorId: number; visibility: PostVisibility }
): Promise<boolean> {
    const isOwner = viewerId === post.authorId;
    if (isOwner) return true;

    const rel = await getUserRelations(viewerId, post.authorId, prisma);

    return canViewPost(post.visibility, {
        isOwner: false,
        isLogged: true,
        isFriend: rel.relState === RelationshipState.FRIENDS,
        following: rel.following,
    });
}
