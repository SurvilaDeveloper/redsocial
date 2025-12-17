// global.d.ts

type PostVisibility = 1 | 2 | 3 | 4;

interface MiniUser {
    id: number;
    name: string;
    imageUrl: string | null;
    imagePublicId?: string | null;
}

interface PostCommentResponse {
    id: number;
    response: string;
    createdAt: string;
    who_responses: number;
    active?: number | null;
    user?: MiniUser; // viene del include
}

interface PostComment {
    id: number;
    comment: string;
    createdAt: string;
    post_id: number;
    who_comments: number;
    active?: number | null;
    user?: MiniUser; // viene del include
    responses?: PostCommentResponse[]; // ✅ clave
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

    relations: {
        following: boolean;
        isFollower: boolean;
        isFriend: boolean;
    };

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
    }[];
}

