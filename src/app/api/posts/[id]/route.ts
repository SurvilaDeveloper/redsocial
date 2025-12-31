// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import { shapePost } from "@/lib/shape-post";
import { getSocialRelations } from "@/lib/social-relations";
import { RelationshipState } from "@/lib/relationship-state";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const { id } = await params;
    const session = await auth();

    const viewerId =
        session?.user?.id != null ? Number(session.user.id) : null;

    const postId = Number(id);

    if (Number.isNaN(postId)) {
        return NextResponse.json(
            { error: "Invalid post id" },
            { status: 400 }
        );
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
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

            images: {
                where: { active: 1 },
                orderBy: { index: "asc" },
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

                    // 👍 nombres CORRECTOS según schema
                    likes: viewerId
                        ? { where: { userId: viewerId } }
                        : true,

                    unlikes: viewerId
                        ? { where: { userId: viewerId } }
                        : true,

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

                            likes: viewerId
                                ? { where: { userId: viewerId } }
                                : true,

                            unlikes: viewerId
                                ? { where: { userId: viewerId } }
                                : true,
                        },
                    },
                },
            },

            // ✅ En Post sí está perfecto usar _count
            _count: {
                select: {
                    post_like: true,
                    post_unlike: true,
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

    // 🔐 Visibilidad
    if (post.visibility !== 1 && post.user_id !== viewerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const relations: SocialRelations = viewerId
        ? await getSocialRelations(viewerId, post.user_id, prisma)
        : {
            following: false,
            isFollower: false,
            relState: RelationshipState.NONE,
        };

    const shapedPost = shapePost(post, relations);

    // 🧠 Shape comentarios y respuestas
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
        userReaction: comment.likes.some(l => l.userId === viewerId)
            ? "LIKE"
            : comment.unlikes.some(u => u.userId === viewerId)
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
            userReaction: response.likes.some(l => l.userId === viewerId)
                ? "LIKE"
                : response.unlikes.some(u => u.userId === viewerId)
                    ? "UNLIKE"
                    : null,

        })),
    }));

    shapedPost.post_comment = shapedComments;

    return NextResponse.json({ data: shapedPost });
}



