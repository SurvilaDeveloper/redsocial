// global.d.ts

type PostVisibility = 1 | 2 | 3 | 4;

interface Post {
    id: number;

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

