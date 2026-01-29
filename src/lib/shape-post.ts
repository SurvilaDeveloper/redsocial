// src/lib/shape-post.ts
import { buildPostRelations } from "./post-relations";
import { buildReaction } from "./reactions";

function toIso(v: any): string {
    // Prisma suele devolver Date; si ya es string lo dejo
    if (!v) return new Date(0).toISOString();
    return typeof v === "string" ? v : (v as Date).toISOString();
}

export function shapePost(post: any, relations: SocialRelations): Post {
    return {
        id: post.id,

        authorId: post.authorId,
        author: post.author ?? null,

        title: post.title ?? null,
        description: post.description ?? null,
        imagenumber: post.imagenumber ?? null,
        createdAt: toIso(post.createdAt),

        active: post.active ?? 1,
        visibility: (post.visibility ?? 1) as PostVisibility,
        deletedAt: post.deletedAt ? toIso(post.deletedAt) : null,

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