// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import { shapePost } from "@/lib/shape-post";
import { getSocialRelations } from "@/lib/social-relations";
import { RelationshipState } from "@/lib/relationship-state";

import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import { areIEnableToView, myOwnPermissions } from "@/lib/permissions";
import { canViewPost } from "@/lib/post-visibility";

import type { Configuration } from "@/types/configuration";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;
    const postId = Number(id);

    if (Number.isNaN(postId)) {
        return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    imagePublicId: true,
                    image: true,
                },
            },

            images: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                include: {
                    _count: {
                        select: {
                            image_like: true,
                            image_unlike: true,
                        },
                    },
                    ...(viewerId && {
                        image_like: {
                            where: { userId: viewerId },
                            select: { id: true },
                        },
                        image_unlike: {
                            where: { userId: viewerId },
                            select: { id: true },
                        },
                    }),
                },
            },

            post_comment: {
                where: { active: 1 },
                orderBy: { createdAt: "asc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            imagePublicId: true,
                            image: true,
                        },
                    },

                    likes: viewerId ? { where: { userId: viewerId } } : true,
                    unlikes: viewerId ? { where: { userId: viewerId } } : true,

                    responses: {
                        where: { active: 1 },
                        orderBy: { createdAt: "asc" },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                    imagePublicId: true,
                                    image: true,
                                },
                            },
                            likes: viewerId ? { where: { userId: viewerId } } : true,
                            unlikes: viewerId ? { where: { userId: viewerId } } : true,
                        },
                    },
                },
            },

            _count: {
                select: {
                    post_like: true,
                    post_unlike: true,
                    post_comment: { where: { active: 1 } },
                },
            },

            ...(viewerId && {
                post_like: {
                    where: { userId: viewerId },
                    select: { id: true },
                },
                post_unlike: {
                    where: { userId: viewerId },
                    select: { id: true },
                },
            }),
        },
    });

    if (!post || post.deletedAt) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const ownerId = post.authorId;

    const relations: SocialRelations =
        viewerId != null
            ? await getSocialRelations(viewerId, ownerId)
            : {
                following: false,
                isFollower: false,
                relState: RelationshipState.NONE,
            };

    const allowed = canViewPost((post.visibility ?? 1) as PostVisibility, {
        isOwner: viewerId === ownerId,
        isLogged: viewerId !== null,
        isFriend: relations.relState === RelationshipState.FRIENDS,
        following: relations.following,
    });

    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const shapedPost = shapePost(post, relations) as Post;

    // commentsCount correcto ya lo arma shapePost, pero si querés forzarlo:
    shapedPost.commentsCount = Number((post._count?.post_comment as any) ?? 0);

    const shapedComments: PostComment[] = post.post_comment.map((comment) => ({
        id: comment.id,
        comment: comment.comment,
        createdAt: comment.createdAt.toISOString(),
        post_id: post.id,
        who_comments: comment.who_comments,
        active: comment.active,
        user: comment.user ?? undefined,

        likesCount: comment.likes.length,
        unlikesCount: comment.unlikes.length,
        userReaction: comment.likes.some((l) => l.userId === viewerId)
            ? "LIKE"
            : comment.unlikes.some((u) => u.userId === viewerId)
                ? "UNLIKE"
                : null,

        responses: comment.responses.map((response) => ({
            id: response.id,
            response: response.response,
            createdAt: response.createdAt.toISOString(),
            who_responses: response.who_responses,
            active: response.active,
            user: response.user ?? undefined,

            likesCount: response.likes.length,
            unlikesCount: response.unlikes.length,
            userReaction: response.likes.some((l) => l.userId === viewerId)
                ? "LIKE"
                : response.unlikes.some((u) => u.userId === viewerId)
                    ? "UNLIKE"
                    : null,
        })),
    }));

    shapedPost.post_comment = shapedComments;

    const ownerConfig: Configuration | null = await getUserConfiguration(ownerId);
    shapedPost.ownerConfiguration = ownerConfig;

    shapedPost.enableToView =
        viewerId === ownerId
            ? myOwnPermissions
            : areIEnableToView(
                ownerConfig,
                viewerId !== null,
                relations.relState === RelationshipState.FRIENDS,
                relations.following
            );

    return NextResponse.json({ data: shapedPost });
}






