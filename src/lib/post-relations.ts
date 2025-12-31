// src/lib/post-relations.ts

import { buildReaction } from "./reactions";

export function buildPostRelations(
    social: SocialRelations,
    post: any
): PostRelations {
    const reaction = buildReaction(
        post._count?.post_like ?? 0,
        post._count?.post_unlike ?? 0,
        post.post_like,
        post.post_unlike
    );

    return {
        ...social,
        ...reaction,
    };
}
