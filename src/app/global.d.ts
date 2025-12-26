// global.d.ts

type PostVisibility = 1 | 2 | 3 | 4;

type PostReaction = "LIKE" | "UNLIKE" | null;

type PostRelations = {
    following: boolean;
    isFollower: boolean;
    isFriend: boolean;
    relState: number; // 👈 AGREGAR
    likesCount: number;
    unlikesCount: number;
    userReaction: PostReaction;
};


interface MiniUser {
    id: number;
    name: string;
    imageUrl: string | null;
    imagePublicId?: string | null;
}

type CommentReaction = "LIKE" | "UNLIKE" | null;

interface PostCommentResponse {
    id: number;
    response: string;
    createdAt: string;
    who_responses: number;
    active?: number | null;
    user?: MiniUser; // viene del include

    // ⭐ NUEVO:
    likesCount?: number;
    unlikesCount?: number;
    userReaction?: CommentReaction;
}

interface PostComment {
    id: number;
    comment: string;
    createdAt: string;
    post_id: number;
    who_comments: number;
    active?: number | null;
    user?: MiniUser;
    responses?: PostCommentResponse[];

    // ⭐ NUEVO
    likesCount?: number;
    unlikesCount?: number;
    userReaction?: CommentReaction;
}

interface Post {
    id: number;
    post_comment?: PostComment[];
    user_id: number; // ✅ dueño del post

    title: string | null;
    description: string | null;

    imagenumber: number | null;
    createdAt: string;

    active: number; // 1/0
    visibility: PostVisibility;

    deletedAt?: string | null; // 🆕 <- importante

    // ⬇⬇⬇ CAMBIO ACÁ
    relations: PostRelations;
    // ⬆⬆⬆ antes era un objeto inline

    userData?: {
        id: number;
        name: string;
        imageUrl: string | null;
        imagePublicId: string | null;
    };

    images?: {
        id: number;
        post_id: number;
        imageUrl: string;
        imagePublicId: string;
        index: number;
        active?: number | null;

        // ⭐ NUEVO, opcional:
        likesCount?: number;
        unlikesCount?: number;
        userReaction?: ImageReaction;
    }[];

    commentsCount?: number; // 👈 nuevo: cantidad de comentarios (para el feed)
}




