// src/lib/shape-post.ts

import { buildPostRelations } from "./post-relations";
import { buildReaction } from "./reactions";

export function shapePost(
    post: any,
    relations: SocialRelations
): Post {
    return {
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        description: post.description,
        imagenumber: post.imagenumber,
        createdAt: post.createdAt,
        active: post.active ?? 1,
        visibility: (post.visibility ?? 1) as PostVisibility,
        deletedAt: post.deletedAt ?? null,

        user: post.user,

        images: (post.images ?? []).map((img: any) => ({
            id: img.id,
            post_id: img.post_id,
            imageUrl: img.imageUrl,
            imagePublicId: img.imagePublicId,
            index: img.index,
            active: img.active ?? 1,
            ...(img._count
                ? buildReaction(
                    img._count.image_like ?? 0,
                    img._count.image_unlike ?? 0,
                    img.image_like,
                    img.image_unlike
                )
                : {}),
        })),

        relations: buildPostRelations(relations, post),

        commentsCount:
            typeof post._count?.post_comment === "number"
                ? post._count.post_comment
                : undefined,

        post_comment: post.post_comment,
    };
}
